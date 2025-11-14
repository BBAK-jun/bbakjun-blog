import { ImageResponse } from 'next/og'
import { getPostBySlug } from '@/lib/posts'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params
    const slugString = slug.join('/')
    
    // 포스트 정보 가져오기
    const post = getPostBySlug(slugString)
    
    if (!post) {
      return new Response('Post not found', { status: 404 })
    }

    const { frontMatter } = post
    const title = frontMatter.title
    const date = frontMatter.date

    // 날짜 포맷팅
    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* 배경 장식 요소 */}
          <div
            style={{
              position: 'absolute',
              top: '-100px',
              right: '-100px',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'rgba(156, 163, 175, 0.1)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-150px',
              left: '-150px',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background: 'rgba(209, 213, 219, 0.15)',
            }}
          />

          {/* 메인 컨텐츠 */}
          <div
            style={{
              display: 'flex',
              height: '100%',
              width: '100%',
              flexDirection: 'column',
              padding: '60px 80px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                marginBottom: 'auto',
              }}
            >
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#374151',
                  letterSpacing: '0.5px',
                }}
              >
                Frontend Engineer
              </div>
              <div style={{ flex: 1 }} />
              <div
                style={{
                  fontSize: '20px',
                  color: '#6b7280',
                  fontWeight: '500',
                }}
              >
                dev-bbak.site
              </div>
            </div>

            {/* Title Section */}
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                maxWidth: '900px',
              }}
            >
              <div
                style={{
                  fontSize: '72px',
                  fontWeight: '800',
                  color: '#111827',
                  lineHeight: '1.1',
                  marginBottom: '24px',
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
                  letterSpacing: '-1px',
                }}
              >
                {title}
              </div>

              {/* Date Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: '32px',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#f9fafb',
                    padding: '12px 24px',
                    borderRadius: '50px',
                    fontSize: '22px',
                    color: '#374151',
                    fontWeight: '500',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  {formatDate(date)}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                marginTop: 'auto',
                paddingTop: '40px',
              }}
            >
              <div
                style={{
                  fontSize: '18px',
                  color: '#6b7280',
                  fontWeight: '400',
                }}
              >
                박준형
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('Error generating OG image:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}

