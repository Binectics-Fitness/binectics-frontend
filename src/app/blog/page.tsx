import Link from 'next/link';

export default function BlogPage() {
  const posts = [
    {
      title: '10 Tips for Maintaining Your Fitness Routine While Traveling',
      excerpt: 'Staying fit on the road doesn\'t have to be complicated. Here are our top tips for keeping up with your workouts while traveling for business or pleasure.',
      author: 'Sarah Chen',
      date: 'November 18, 2024',
      readTime: '5 min read',
      category: 'Fitness Tips',
      image: '🏃',
    },
    {
      title: 'The Rise of Hybrid Gym Memberships: What You Need to Know',
      excerpt: 'Hybrid gym memberships are changing the fitness industry. Learn how this new model gives you flexibility and value like never before.',
      author: 'Marcus Johnson',
      date: 'November 12, 2024',
      readTime: '7 min read',
      category: 'Industry Trends',
      image: '🏋️',
    },
    {
      title: 'How to Choose the Right Personal Trainer for Your Goals',
      excerpt: 'Finding the perfect trainer can make or break your fitness journey. Here\'s everything you need to consider when selecting a personal trainer.',
      author: 'Alex Rodriguez',
      date: 'November 5, 2024',
      readTime: '6 min read',
      category: 'Training',
      image: '💪',
    },
    {
      title: 'Nutrition Myths Debunked by Professional Dieticians',
      excerpt: 'Our expert dieticians tackle the most common nutrition myths and reveal the truth behind popular diet trends.',
      author: 'Priya Patel',
      date: 'October 28, 2024',
      readTime: '8 min read',
      category: 'Nutrition',
      image: '🥗',
    },
    {
      title: 'The Future of Fitness Technology: QR Check-ins and Beyond',
      excerpt: 'Contactless technology is revolutionizing gym experiences. Explore how QR check-ins and other innovations are shaping the future of fitness.',
      author: 'David Kim',
      date: 'October 20, 2024',
      readTime: '5 min read',
      category: 'Technology',
      image: '📱',
    },
    {
      title: 'Building a Sustainable Workout Routine: A Beginner\'s Guide',
      excerpt: 'Starting a new fitness routine? Learn how to create sustainable habits that will keep you motivated for the long haul.',
      author: 'Emma Thompson',
      date: 'October 15, 2024',
      readTime: '6 min read',
      category: 'Fitness Tips',
      image: '✨',
    },
  ];

  const categories = [
    'All Posts',
    'Fitness Tips',
    'Nutrition',
    'Training',
    'Industry Trends',
    'Technology',
  ];

  return (
    <div className="min-h-screen bg-background-secondary">{/* Hero Section */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl font-black text-foreground sm:text-5xl lg:text-6xl">
            Binectics Blog
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-foreground-secondary leading-relaxed">
            Fitness tips, nutrition advice, industry insights, and stories from our global community
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-neutral-100 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category, index) => (
              <button
                key={index}
                className={`rounded-full px-6 py-2 text-sm font-semibold transition-colors ${
                  index === 0
                    ? 'bg-primary-500 text-white'
                    : 'bg-background text-foreground-secondary hover:bg-neutral-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <article
                key={index}
                className="group rounded-2xl bg-neutral-100 overflow-hidden shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="flex h-48 items-center justify-center bg-gradient-to-br from-primary-500 to-accent-blue-500 text-6xl">
                  {post.image}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-600">
                      {post.category}
                    </span>
                    <span className="text-xs text-foreground-tertiary">{post.readTime}</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-3 group-hover:text-accent-blue-500 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-foreground-secondary leading-relaxed mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground-tertiary">{post.author}</span>
                    <span className="text-foreground-tertiary">{post.date}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Load More */}
          <div className="mt-12 text-center">
            <button className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-neutral-300 px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-neutral-100">
              Load More Articles
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-primary-500 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
            Subscribe to Our Newsletter
          </h2>
          <p className="mt-4 text-lg text-foreground-secondary">
            Get weekly fitness tips, nutrition advice, and exclusive content delivered to your inbox
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 h-12 rounded-lg border-2 border-transparent bg-background px-4 text-base focus:outline-none focus:border-accent-blue-500"
            />
            <button className="h-12 rounded-lg bg-background px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-neutral-50">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
    </div>
  );
}
