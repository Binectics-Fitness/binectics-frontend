import Link from 'next/link';

export default function PressPage() {
  const pressReleases = [
    {
      date: 'November 15, 2024',
      title: 'Binectics Expands to 50 Countries, Surpasses 500 Partner Gyms Worldwide',
      excerpt: 'Global fitness platform announces major milestone in international expansion, bringing seamless gym access to millions.',
      category: 'Company News',
    },
    {
      date: 'October 22, 2024',
      title: 'Binectics Raises $25M Series B to Transform Global Fitness Access',
      excerpt: 'Funding led by Sequoia Capital will accelerate product development and geographic expansion across Europe and Asia.',
      category: 'Funding',
    },
    {
      date: 'September 10, 2024',
      title: 'QR Check-in Technology Reduces Gym Entry Time by 80%',
      excerpt: 'New study shows Binectics\' contactless check-in system significantly improves member experience and gym operations.',
      category: 'Product',
    },
    {
      date: 'August 5, 2024',
      title: 'Partnership with Leading Gym Chains Adds 200 New Locations',
      excerpt: 'Major fitness brands join Binectics platform, expanding member access across North America.',
      category: 'Partnership',
    },
  ];

  const mediaLogos = [
    { name: 'TechCrunch', logo: 'TC' },
    { name: 'Forbes', logo: 'F' },
    { name: 'Wall Street Journal', logo: 'WSJ' },
    { name: 'Bloomberg', logo: 'B' },
    { name: 'The Verge', logo: 'TV' },
    { name: 'CNBC', logo: 'C' },
  ];

  const pressKit = [
    {
      title: 'Company Logo Pack',
      description: 'High-resolution logos in various formats (PNG, SVG, EPS)',
      size: '2.5 MB',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'Brand Guidelines',
      description: 'Complete brand style guide including colors, typography, and usage',
      size: '8.1 MB',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
    },
    {
      title: 'Product Screenshots',
      description: 'App screenshots and product images for editorial use',
      size: '15.3 MB',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      ),
    },
    {
      title: 'Executive Photos',
      description: 'High-resolution photos of company leadership team',
      size: '12.7 MB',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background-secondary">{/* Hero Section */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl font-black text-foreground sm:text-5xl lg:text-6xl">
            Press & Media
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-foreground-secondary leading-relaxed">
            Latest news, press releases, and media resources from Binectics
          </p>
        </div>
      </section>

      {/* As Seen In */}
      <section className="bg-neutral-100 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-foreground-tertiary mb-8">AS SEEN IN</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-8 items-center justify-items-center">
            {mediaLogos.map((media, index) => (
              <div
                key={index}
                className="flex h-16 w-full items-center justify-center rounded-lg bg-background p-4"
              >
                <div className="font-display text-2xl font-black text-foreground-tertiary">
                  {media.logo}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-12 sm:text-4xl">
            Latest Press Releases
          </h2>
          <div className="space-y-8">
            {pressReleases.map((release, index) => (
              <article
                key={index}
                className="rounded-2xl bg-neutral-100 p-6 sm:p-8 shadow-card transition-all duration-300 hover:shadow-xl"
              >
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="rounded-full bg-primary-500 px-3 py-1 text-xs font-semibold text-white">
                    {release.category}
                  </span>
                  <span className="text-sm text-foreground-tertiary">{release.date}</span>
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-3 sm:text-2xl">
                  {release.title}
                </h3>
                <p className="text-foreground-secondary leading-relaxed mb-4">
                  {release.excerpt}
                </p>
                <a
                  href={`mailto:press@binectics.com?subject=Press Inquiry: ${release.title}`}
                  className="inline-flex items-center gap-2 text-accent-blue-500 font-semibold hover:underline"
                >
                  Read Full Release
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Press Kit */}
      <section className="bg-neutral-100 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
              Press Kit
            </h2>
            <p className="mt-4 text-lg text-foreground-secondary">
              Download our brand assets and media resources
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {pressKit.map((item, index) => (
              <button
                key={index}
                className="group text-left rounded-2xl bg-background p-6 shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                  {item.icon}
                </div>
                <h3 className="font-bold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-foreground-secondary mb-3 leading-relaxed">
                  {item.description}
                </p>
                <p className="text-xs text-foreground-tertiary">{item.size}</p>
              </button>
            ))}
          </div>
          <div className="mt-8 text-center">
            <a
              href="mailto:press@binectics.com?subject=Press Kit Request"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary-500 px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-primary-600"
            >
              Download Complete Press Kit
            </a>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-primary-500 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
              Media Inquiries
            </h2>
            <p className="mt-4 text-lg text-foreground-secondary">
              For press inquiries, interviews, or additional information
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:press@binectics.com"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-background px-8 text-base font-semibold text-foreground shadow-lg transition-colors duration-200 hover:bg-neutral-50"
              >
                press@binectics.com
              </a>
              <a
                href="tel:+15551234567"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-foreground/10 backdrop-blur-sm px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-foreground/20"
              >
                +1 (555) 123-4567
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
    </div>
  );
}
