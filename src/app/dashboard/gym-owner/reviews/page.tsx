'use client';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';
export default function ReviewsPage() {
  const reviews = [
    { id: 1, author: 'John Smith', rating: 5, text: 'Great gym!', date: '2 days ago' },
    { id: 2, author: 'Sarah J.', rating: 4, text: 'Good equipment.', date: '1 week ago' },
  ];
  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-black text-foreground mb-8">Reviews</h1>
        <div className="bg-white rounded-xl shadow-card p-6">
          {reviews.map(r => (
            <div key={r.id} className="p-4 border-b last:border-0">
              <p className="font-semibold">{r.author}</p>
              <p>{r.text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
