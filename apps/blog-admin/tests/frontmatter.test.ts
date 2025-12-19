/**
 * Frontmatter Parser Tests
 *
 * Tests for YAML frontmatter parsing and serialization
 */

import { describe, it, expect } from "vitest";
import {
  parseFrontMatter,
  serializeFrontMatter,
  combineContent,
  type FrontMatter,
} from "../src/entities/frontmatter/lib/frontmatter";

describe("parseFrontMatter", () => {
  it("should parse basic frontmatter with simple values", () => {
    const content = `---
title: "Test Post"
description: "A simple test"
date: "2024-01-01"
tags: ["nextjs", "react"]
author: "bbakjun"
draft: false
---
# Content here`;

    const { frontMatter, body } = parseFrontMatter(content);

    expect(frontMatter).toEqual({
      title: "Test Post",
      description: "A simple test",
      date: "2024-01-01",
      tags: ["nextjs", "react"],
      author: "bbakjun",
      draft: false,
    });
    expect(body).toBe("# Content here");
  });

  it("should parse multiline description with folded scalar (>-)", () => {
    const content = `---
title: "Vercel Blob CDC"
description: >-
  무료 티어 초과 메일 한 통에서 시작된 Postgres CDC 캐시 파이프라인 구축기. list() 호출을 99% 줄이고 응답 속도를 10배
  개선한 과정
date: "2024-12-19"
tags: ["vercel", "blob", "postgres", "cdc"]
author: "bbakjun"
draft: false
---
# Main content`;

    const { frontMatter, body } = parseFrontMatter(content);

    expect(frontMatter?.title).toBe("Vercel Blob CDC");
    expect(frontMatter?.description).toContain("무료 티어 초과 메일");
    expect(frontMatter?.description).toContain("응답 속도를 10배");
    expect(frontMatter?.description).not.toContain("\n"); // Should be folded into single line
    expect(frontMatter?.tags).toEqual(["vercel", "blob", "postgres", "cdc"]);
    expect(body).toBe("# Main content");
  });

  it("should parse multiline description with literal scalar (|)", () => {
    const content = `---
title: "Multi-line Test"
description: |
  Line 1
  Line 2
  Line 3
date: "2024-01-01"
tags: ["test"]
author: "bbakjun"
---
Content`;

    const { frontMatter, body } = parseFrontMatter(content);

    expect(frontMatter?.description).toContain("Line 1");
    expect(frontMatter?.description).toContain("Line 2");
    expect(frontMatter?.description).toContain("Line 3");
  });

  it("should parse series fields", () => {
    const content = `---
title: "Series Post"
description: "Part of a series"
date: "2024-01-01"
tags: ["series"]
author: "bbakjun"
series: "react-deep-dive"
seriesOrder: 3
---
Content`;

    const { frontMatter, body } = parseFrontMatter(content);

    expect(frontMatter?.series).toBe("react-deep-dive");
    expect(frontMatter?.seriesOrder).toBe(3);
    expect(typeof frontMatter?.seriesOrder).toBe("number");
  });

  it("should handle optional fields", () => {
    const content = `---
title: "Minimal Post"
description: "Basic post"
date: "2024-01-01"
tags: ["test"]
author: "bbakjun"
---
Content`;

    const { frontMatter, body } = parseFrontMatter(content);

    expect(frontMatter?.draft).toBeUndefined();
    expect(frontMatter?.series).toBeUndefined();
    expect(frontMatter?.seriesOrder).toBeUndefined();
  });

  it("should handle draft field", () => {
    const content = `---
title: "Draft Post"
description: "Work in progress"
date: "2024-01-01"
tags: ["test"]
author: "bbakjun"
draft: true
---
Content`;

    const { frontMatter, body } = parseFrontMatter(content);

    expect(frontMatter?.draft).toBe(true);
  });

  it("should return null frontMatter for content without frontmatter", () => {
    const content = "# Just regular markdown\n\nNo frontmatter here.";

    const { frontMatter, body } = parseFrontMatter(content);

    expect(frontMatter).toBeNull();
    expect(body).toBe(content);
  });

  it("should handle empty frontmatter", () => {
    const content = `---
---
# Content`;

    const { frontMatter, body } = parseFrontMatter(content);

    expect(frontMatter).toBeNull(); // gray-matter returns empty object, we convert to null
    // gray-matter preserves the empty frontmatter markers in the body
    expect(body).toBe(content);
  });

  it("should handle malformed YAML gracefully", () => {
    const content = `---
title: "Test"
invalid yaml syntax here: [unclosed
---
Content`;

    const { frontMatter, body } = parseFrontMatter(content);

    // Should return null and log error, but not throw
    expect(frontMatter).toBeNull();
    expect(body).toBe(content);
  });

  it("should parse arrays in different formats", () => {
    const content1 = `---
title: "Test"
description: "Test"
date: "2024-01-01"
tags: ["tag1", "tag2", "tag3"]
author: "bbakjun"
---
Content`;

    const content2 = `---
title: "Test"
description: "Test"
date: "2024-01-01"
tags:
  - tag1
  - tag2
  - tag3
author: "bbakjun"
---
Content`;

    const { frontMatter: fm1 } = parseFrontMatter(content1);
    const { frontMatter: fm2 } = parseFrontMatter(content2);

    expect(fm1?.tags).toEqual(["tag1", "tag2", "tag3"]);
    expect(fm2?.tags).toEqual(["tag1", "tag2", "tag3"]);
  });
});

describe("serializeFrontMatter", () => {
  it("should serialize frontmatter to YAML", () => {
    const frontMatter: Partial<FrontMatter> = {
      title: "Test Post",
      description: "A test description",
      date: "2024-01-01",
      tags: ["nextjs", "react"],
      author: "bbakjun",
      draft: false,
    };

    const yaml = serializeFrontMatter(frontMatter);

    expect(yaml).toContain("title:");
    expect(yaml).toContain("Test Post");
    expect(yaml).toContain("description:");
    expect(yaml).toContain("tags:");
    expect(yaml).toContain("nextjs");
    expect(yaml).toContain("react");
  });

  it("should filter out undefined and null values", () => {
    const frontMatter: Partial<FrontMatter> = {
      title: "Test",
      description: "Test",
      date: "2024-01-01",
      tags: ["test"],
      author: "bbakjun",
      draft: undefined,
      series: undefined,
      seriesOrder: undefined,
    };

    const yaml = serializeFrontMatter(frontMatter);

    expect(yaml).not.toContain("draft:");
    expect(yaml).not.toContain("series:");
    expect(yaml).not.toContain("seriesOrder:");
  });

  it("should handle series fields", () => {
    const frontMatter: Partial<FrontMatter> = {
      title: "Series Post",
      description: "Part of series",
      date: "2024-01-01",
      tags: ["test"],
      author: "bbakjun",
      series: "react-deep-dive",
      seriesOrder: 3,
    };

    const yaml = serializeFrontMatter(frontMatter);

    expect(yaml).toContain("series:");
    expect(yaml).toContain("react-deep-dive");
    expect(yaml).toContain("seriesOrder:");
    expect(yaml).toContain("3");
  });
});

describe("combineContent", () => {
  it("should combine frontmatter and content", () => {
    const frontMatter: Partial<FrontMatter> = {
      title: "Test Post",
      description: "A test",
      date: "2024-01-01",
      tags: ["nextjs"],
      author: "bbakjun",
    };

    const content = "# Main heading\n\nParagraph content.";
    const combined = combineContent(frontMatter, content);

    expect(combined).toContain("---");
    expect(combined).toContain("title:");
    expect(combined).toContain("Test Post");
    expect(combined).toContain("# Main heading");
    expect(combined).toContain("Paragraph content.");
  });

  it("should create valid markdown that can be parsed back", () => {
    const originalFrontMatter: Partial<FrontMatter> = {
      title: "Round Trip Test",
      description: "Test round trip parsing",
      date: "2024-01-01",
      tags: ["test", "roundtrip"],
      author: "bbakjun",
      draft: false,
      series: "testing",
      seriesOrder: 1,
    };

    const originalContent = "# Content\n\nTest content.";
    const combined = combineContent(originalFrontMatter, originalContent);

    // Parse it back
    const { frontMatter: parsedFrontMatter, body: parsedBody } =
      parseFrontMatter(combined);

    expect(parsedFrontMatter?.title).toBe(originalFrontMatter.title);
    expect(parsedFrontMatter?.description).toBe(originalFrontMatter.description);
    expect(parsedFrontMatter?.tags).toEqual(originalFrontMatter.tags);
    expect(parsedFrontMatter?.author).toBe(originalFrontMatter.author);
    expect(parsedFrontMatter?.draft).toBe(originalFrontMatter.draft);
    expect(parsedFrontMatter?.series).toBe(originalFrontMatter.series);
    expect(parsedFrontMatter?.seriesOrder).toBe(originalFrontMatter.seriesOrder);
    // gray-matter adds trailing newline to body
    expect(parsedBody.trim()).toBe(originalContent.trim());
  });

  it("should filter out undefined values before combining", () => {
    const frontMatter: Partial<FrontMatter> = {
      title: "Test",
      description: "Test",
      date: "2024-01-01",
      tags: ["test"],
      author: "bbakjun",
      draft: undefined,
      series: undefined,
    };

    const combined = combineContent(frontMatter, "Content");

    expect(combined).not.toContain("draft:");
    expect(combined).not.toContain("series:");
  });
});

describe("Real-world multiline description test", () => {
  it("should correctly parse the actual CDC blog post frontmatter", () => {
    const realContent = `---
title: Vercel Blob CDC로 무료 티어 살리기
description: >-
  무료 티어 초과 메일 한 통에서 시작된 Postgres CDC 캐시 파이프라인 구축기. list() 호출을 99% 줄이고 응답 속도를 10배
  개선한 과정
date: "2024-12-19"
tags:
  - vercel
  - blob
  - postgres
  - cdc
  - cache
author: bbakjun
draft: false
---

# Introduction

This is the actual blog post content.`;

    const { frontMatter, body } = parseFrontMatter(realContent);

    // Critical assertions for the bug fix
    expect(frontMatter).not.toBeNull();
    expect(frontMatter?.title).toBe("Vercel Blob CDC로 무료 티어 살리기");
    expect(frontMatter?.description).toBeTruthy();
    expect(frontMatter?.description?.length).toBeGreaterThan(0);
    expect(frontMatter?.description).toContain("무료 티어 초과");
    expect(frontMatter?.description).toContain("99% 줄이고");
    expect(frontMatter?.description).toContain("10배");
    expect(frontMatter?.tags).toEqual([
      "vercel",
      "blob",
      "postgres",
      "cdc",
      "cache",
    ]);
    expect(frontMatter?.author).toBe("bbakjun");
    expect(frontMatter?.draft).toBe(false);
    expect(body).toContain("# Introduction");
    expect(body).toContain("actual blog post content");
  });
});
