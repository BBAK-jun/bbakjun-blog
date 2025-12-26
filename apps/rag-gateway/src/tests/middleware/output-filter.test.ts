/**
 * 출력 필터링 미들웨어 테스트
 *
 * 민감정보 삭제 기능을 검증합니다.
 */

import { describe, it, expect } from 'vitest';
import {
  redactSensitiveInfo,
  detectSensitiveInfo,
  filterRAGResponse,
  containsSensitiveInfo,
  SENSITIVE_PATTERNS,
  DEFAULT_REDACT_OPTIONS,
} from '@/middleware/output-filter';

describe('출력 필터링 - redactSensitiveInfo()', () => {
  describe('이메일 삭제', () => {
    it('이메일 주소를 삭제해야 함', () => {
      const text = 'Contact user@example.com for support';
      const result = redactSensitiveInfo(text);
      expect(result).toContain('[REDACTED]');
      expect(result).not.toContain('user@example.com');
    });

    it('여러 이메일을 모두 삭제해야 함', () => {
      const text = 'Email admin@test.com or user@test.com';
      const result = redactSensitiveInfo(text);
      const matches = result.match(/\[REDACTED\]/g);
      expect(matches?.length).toBe(2);
    });

    it('대소문자를 구분하지 않아야 함', () => {
      const text = 'Email USER@EXAMPLE.COM';
      const result = redactSensitiveInfo(text);
      expect(result).toContain('[REDACTED]');
    });
  });

  describe('신용카드 번호 삭제', () => {
    it('16자리 신용카드 번호를 삭제해야 함', () => {
      const text = 'Card number: 4532015112830366';
      const result = redactSensitiveInfo(text);
      expect(result).toContain('[REDACTED]');
      expect(result).not.toContain('4532015112830366');
    });

    it('하이픈이 포함된 카드 번호를 삭제해야 함', () => {
      const text = 'Card: 4532-0151-1283-0366';
      const result = redactSensitiveInfo(text);
      expect(result).toContain('[REDACTED]');
    });

    it('공백이 포함된 카드 번호를 삭제해야 함', () => {
      const text = 'Card: 4532 0151 1283 0366';
      const result = redactSensitiveInfo(text);
      expect(result).toContain('[REDACTED]');
    });
  });

  describe('전화번호 삭제', () => {
    it('국제 전화번호를 삭제해야 함', () => {
      const text = 'Call +1 234 567 8900';
      const result = redactSensitiveInfo(text);
      expect(result).toContain('[REDACTED]');
    });

    it('하이픈이 포함된 전화번호를 삭제해야 함', () => {
      const text = 'Phone: 123-456-7890';
      const result = redactSensitiveInfo(text);
      expect(result).toContain('[REDACTED]');
    });
  });

  describe('API 키 및 토큰 삭제', () => {
    it('Bearer 토큰을 삭제해야 함', () => {
      const text = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const result = redactSensitiveInfo(text);
      expect(result).toContain('[REDACTED]');
      expect(result).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('긴 API 키를 삭제해야 함', () => {
      const text = 'API key: sk-1234567890abcdefghijklmnopqrstuvwxyz123456';
      const result = redactSensitiveInfo(text);
      expect(result).toContain('[REDACTED]');
    });

    it('AWS Access Key ID를 삭제해야 함', () => {
      const text = 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE';
      const result = redactSensitiveInfo(text);
      expect(result).toContain('[REDACTED]');
      expect(result).not.toContain('AKIAIOSFODNN7EXAMPLE');
    });

    it('AWS Secret Key를 삭제해야 함', () => {
      const text = 'AWS_SECRET=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
      const result = redactSensitiveInfo(text);
      expect(result).toContain('[REDACTED]');
    });
  });

  describe('URL 자격증민 삭제', () => {
    it('URL에 포함된 자격증민을 삭제해야 함', () => {
      const text = 'Connect to mongodb://user:password@localhost/database';
      const result = redactSensitiveInfo(text);
      expect(result).toContain('[REDACTED]');
      expect(result).not.toContain('user:password');
    });
  });

  describe('부분 삭제 옵션', () => {
    it('preservePartial: true 시 일부만 표시해야 함', () => {
      const text = 'Email user@example.com';
      const result = redactSensitiveInfo(text, { preservePartial: true });
      // Should contain "use" prefix and asterisks, with "Email " prefix intact
      expect(result).toContain('Email use');
      expect(result).toMatch(/use\*+/);
    });

    it('preservePartial: true 시 처음 몇 글자만 보여야 함', () => {
      const text = 'API key: sk-1234567890abcdefghijklmnopqrstuvwxyz';
      const result = redactSensitiveInfo(text, { preservePartial: true });
      // 처음 3글자만 보이고 나머지는 *로 대체
      expect(result).toContain('sk-');
      expect(result).toContain('*');
    });
  });

  describe('커스텀 패턴', () => {
    it('특정 패턴만 선택적으로 적용할 수 있어야 함', () => {
      const text = 'Email user@example.com, Phone 123-456-7890';
      const result = redactSensitiveInfo(text, {
        patterns: ['email'],
        replacement: '***',
      });
      expect(result).toContain('***');
      expect(result).toContain('123-456-7890'); // 전화번호는 그대로
    });
  });

  describe('커스텀 대체 문자열', () => {
    it('커스텀 replacement을 적용할 수 있어야 함', () => {
      const text = 'Email user@example.com';
      const result = redactSensitiveInfo(text, { replacement: '***HIDDEN***' });
      expect(result).toContain('***HIDDEN***');
      expect(result).not.toContain('[REDACTED]');
    });
  });
});

describe('출력 필터링 - detectSensitiveInfo()', () => {
  it('감지된 민감정보 유형과 일치 항목을 반환해야 함', () => {
    const text = 'Contact user@example.com for support';
    const result = detectSensitiveInfo(text);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe('email');
    expect(result[0].matches).toContain('user@example.com');
  });

  it('여러 유형을 감지할 수 있어야 함', () => {
    const text = 'Email user@example.com, Card 4532015112830366';
    const result = detectSensitiveInfo(text);
    const types = result.map(r => r.type);
    expect(types).toContain('email');
    expect(types).toContain('creditCard');
  });

  it('정상 텍스트는 빈 배열을 반환해야 함', () => {
    const text = 'This is normal text without sensitive info';
    const result = detectSensitiveInfo(text);
    expect(result).toEqual([]);
  });

  it('중복된 일치 항목을 제거해야 함', () => {
    const text = 'user@example.com user@example.com';
    const result = detectSensitiveInfo(text);
    expect(result[0].matches.length).toBe(1);
  });
});

describe('출력 필터링 - filterRAGResponse()', () => {
  it('객체의 문자열 필드를 필터링해야 함', () => {
    const response = {
      answer: 'Contact user@example.com',
      sources: [],
    };
    const result = filterRAGResponse(response);
    expect(result.answer).toContain('[REDACTED]');
    expect(result.answer).not.toContain('user@example.com');
  });

  it('중첩 객체를 재귀적으로 필터링해야 함', () => {
    const response = {
      answer: 'Hello',
      metadata: {
        contact: 'user@example.com',
        phone: '123-456-7890',
      },
    };
    const result = filterRAGResponse(response);
    expect(result.metadata.contact).toContain('[REDACTED]');
    expect(result.metadata.phone).toContain('[REDACTED]');
  });

  it('배열 내 객체를 필터링해야 함', () => {
    const response = {
      answer: 'Hello',
      sources: [{ content: 'Email user@example.com' }, { content: 'Phone 123-456-7890' }],
    };
    const result = filterRAGResponse(response);
    expect(result.sources[0].content).toContain('[REDACTED]');
    expect(result.sources[1].content).toContain('[REDACTED]');
  });

  it('배열 내 문자열을 필터링해야 함', () => {
    const response = {
      items: ['user@example.com', 'admin@test.com'],
    };
    const result = filterRAGResponse(response);
    expect(result.items[0]).toContain('[REDACTED]');
    expect(result.items[1]).toContain('[REDACTED]');
  });

  it('원본 객체를 수정하지 않아야 함', () => {
    const original = {
      answer: 'Contact user@example.com',
    };
    const originalCopy = { ...original };
    filterRAGResponse(original);
    expect(original.answer).toBe(originalCopy.answer);
  });

  it('숫자와 불리언은 그대로 유지해야 함', () => {
    const response = {
      count: 42,
      verified: true,
      score: 0.95,
    };
    const result = filterRAGResponse(response);
    expect(result.count).toBe(42);
    expect(result.verified).toBe(true);
    expect(result.score).toBe(0.95);
  });
});

describe('출력 필터링 - containsSensitiveInfo()', () => {
  it('민감정보가 포함된 필드를 감지해야 함', () => {
    const response = {
      answer: 'Contact user@example.com',
      sources: [],
    };
    const result = containsSensitiveInfo(response);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].field).toBe('answer');
    expect(result[0].type).toBe('email');
  });

  it('중첩 객체의 필드 경로를 반환해야 함', () => {
    const response = {
      answer: 'Hello',
      metadata: {
        contact: 'user@example.com',
      },
    };
    const result = containsSensitiveInfo(response);
    expect(result[0].field).toBe('metadata.contact');
  });

  it('배열 요소의 인덱스를 포함해야 함', () => {
    const response = {
      sources: [{ content: 'Email user@example.com' }, { content: 'Normal text' }],
    };
    const result = containsSensitiveInfo(response);
    expect(result[0].field).toBe('sources[0].content');
  });

  it('민감정보가 없으면 빈 배열을 반환해야 함', () => {
    const response = {
      answer: 'This is normal text',
      sources: [],
    };
    const result = containsSensitiveInfo(response);
    expect(result).toEqual([]);
  });
});

describe('출력 필터링 - SENSITIVE_PATTERNS', () => {
  it('모든 패턴이 RegExp여야 함', () => {
    const patternKeys = Object.keys(SENSITIVE_PATTERNS) as Array<keyof typeof SENSITIVE_PATTERNS>;
    patternKeys.forEach(key => {
      expect(SENSITIVE_PATTERNS[key]).toBeInstanceOf(RegExp);
    });
  });

  it('필수 패턴이 모두 정의되어 있어야 함', () => {
    const requiredPatterns = [
      'email',
      'creditCard',
      'phone',
      'authToken',
      'apiKey',
      'awsAccessKey',
      'awsSecretKey',
      'urlWithCredentials',
    ] as Array<keyof typeof SENSITIVE_PATTERNS>;

    requiredPatterns.forEach(pattern => {
      expect(SENSITIVE_PATTERNS[pattern]).toBeDefined();
    });
  });
});

describe('출력 필터링 - DEFAULT_REDACT_OPTIONS', () => {
  it('기본 패턴이 정의되어 있어야 함', () => {
    expect(DEFAULT_REDACT_OPTIONS.patterns).toBeDefined();
    expect(DEFAULT_REDACT_OPTIONS.patterns?.length).toBeGreaterThan(0);
  });

  it('기본 대체 문자열이 정의되어 있어야 함', () => {
    expect(DEFAULT_REDACT_OPTIONS.replacement).toBe('[REDACTED]');
  });

  it('preservePartial가 false여야 함', () => {
    expect(DEFAULT_REDACT_OPTIONS.preservePartial).toBe(false);
  });
});
