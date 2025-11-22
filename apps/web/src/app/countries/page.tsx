import Link from 'next/link';

export default function CountriesPage() {
  const regions = [
    {
      name: 'North America',
      countries: [
        { name: 'United States', code: 'us', gyms: 180, trainers: 250, flag: '🇺🇸' },
        { name: 'Canada', code: 'ca', gyms: 70, trainers: 95, flag: '🇨🇦' },
        { name: 'Mexico', code: 'mx', gyms: 35, trainers: 48, flag: '🇲🇽' },
      ],
    },
    {
      name: 'Europe',
      countries: [
        { name: 'United Kingdom', code: 'gb', gyms: 90, trainers: 120, flag: '🇬🇧' },
        { name: 'Germany', code: 'de', gyms: 50, trainers: 70, flag: '🇩🇪' },
        { name: 'France', code: 'fr', gyms: 45, trainers: 65, flag: '🇫🇷' },
        { name: 'Spain', code: 'es', gyms: 40, trainers: 55, flag: '🇪🇸' },
        { name: 'Italy', code: 'it', gyms: 38, trainers: 52, flag: '🇮🇹' },
        { name: 'Netherlands', code: 'nl', gyms: 30, trainers: 42, flag: '🇳🇱' },
        { name: 'Sweden', code: 'se', gyms: 25, trainers: 35, flag: '🇸🇪' },
        { name: 'Switzerland', code: 'ch', gyms: 22, trainers: 30, flag: '🇨🇭' },
      ],
    },
    {
      name: 'Asia Pacific',
      countries: [
        { name: 'Australia', code: 'au', gyms: 60, trainers: 85, flag: '🇦🇺' },
        { name: 'Japan', code: 'jp', gyms: 40, trainers: 55, flag: '🇯🇵' },
        { name: 'Singapore', code: 'sg', gyms: 30, trainers: 45, flag: '🇸🇬' },
        { name: 'South Korea', code: 'kr', gyms: 28, trainers: 40, flag: '🇰🇷' },
        { name: 'India', code: 'in', gyms: 35, trainers: 50, flag: '🇮🇳' },
        { name: 'Thailand', code: 'th', gyms: 20, trainers: 28, flag: '🇹🇭' },
        { name: 'New Zealand', code: 'nz', gyms: 15, trainers: 22, flag: '🇳🇿' },
      ],
    },
    {
      name: 'Middle East & Africa',
      countries: [
        { name: 'United Arab Emirates', code: 'ae', gyms: 32, trainers: 45, flag: '🇦🇪' },
        { name: 'South Africa', code: 'za', gyms: 25, trainers: 35, flag: '🇿🇦' },
        { name: 'Israel', code: 'il', gyms: 18, trainers: 25, flag: '🇮🇱' },
        { name: 'Qatar', code: 'qa', gyms: 12, trainers: 18, flag: '🇶🇦' },
      ],
    },
    {
      name: 'South America',
      countries: [
        { name: 'Brazil', code: 'br', gyms: 42, trainers: 58, flag: '🇧🇷' },
        { name: 'Argentina', code: 'ar', gyms: 28, trainers: 38, flag: '🇦🇷' },
        { name: 'Chile', code: 'cl', gyms: 18, trainers: 25, flag: '🇨🇱' },
        { name: 'Colombia', code: 'co', gyms: 22, trainers: 30, flag: '🇨🇴' },
      ],
    },
  ];

  const totalGyms = regions.reduce((sum, region) =>
    sum + region.countries.reduce((regionSum, country) => regionSum + country.gyms, 0), 0
  );

  const totalTrainers = regions.reduce((sum, region) =>
    sum + region.countries.reduce((regionSum, country) => regionSum + country.trainers, 0), 0
  );

  return (
    <div className="min-h-screen bg-background-secondary">{/* Hero Section */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl font-black text-foreground sm:text-5xl lg:text-6xl">
            Train Anywhere in the World
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-foreground-secondary leading-relaxed">
            One membership, 50+ countries, {totalGyms.toLocaleString()}+ verified gyms and {totalTrainers.toLocaleString()}+ certified professionals
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-neutral-100 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="font-display text-4xl font-black text-primary-500">50+</div>
              <div className="mt-2 text-sm text-foreground-secondary">Countries</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl font-black text-primary-500">{totalGyms}+</div>
              <div className="mt-2 text-sm text-foreground-secondary">Gyms & Studios</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl font-black text-primary-500">{totalTrainers}+</div>
              <div className="mt-2 text-sm text-foreground-secondary">Professionals</div>
            </div>
          </div>
        </div>
      </section>

      {/* Countries by Region */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {regions.map((region, index) => (
              <div key={index}>
                <h2 className="font-display text-2xl font-black text-foreground mb-8 sm:text-3xl">
                  {region.name}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {region.countries.map((country, countryIndex) => (
                    <Link
                      key={countryIndex}
                      href={`/countries/${country.code}`}
                      className="group rounded-2xl bg-neutral-100 p-6 shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-5xl">{country.flag}</div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-foreground group-hover:text-accent-blue-500 transition-colors">
                            {country.name}
                          </h3>
                          <div className="mt-3 space-y-1 text-sm">
                            <p className="text-foreground-secondary">
                              {country.gyms}+ gyms
                            </p>
                            <p className="text-foreground-secondary">
                              {country.trainers}+ professionals
                            </p>
                          </div>
                        </div>
                        <svg className="h-5 w-5 text-foreground-tertiary group-hover:text-accent-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-500 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
            Your fitness journey knows no borders
          </h2>
          <p className="mt-4 text-lg text-foreground-secondary">
            Start your global fitness membership today
          </p>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-background px-8 text-base font-semibold text-foreground shadow-lg transition-colors duration-200 hover:bg-neutral-50"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
    </div>
  );
}
