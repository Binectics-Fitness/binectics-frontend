'use client';

import { useParams, useRouter } from 'next/navigation';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';

export default function MemberBillingPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.memberId as string;

  const member = {
    id: memberId,
    name: 'John Smith',
    email: 'john.smith@example.com',
    currentPlan: 'Basic Monthly - $49/month',
    nextBillingDate: '2024-02-15',
    paymentMethod: 'Visa ****4242',
  };

  const paymentHistory = [
    { id: 1, date: '2024-01-15', description: 'Basic Monthly Subscription', amount: 49, status: 'PAID', method: 'Visa ****4242', invoiceId: 'INV-2024-001' },
    { id: 2, date: '2023-12-15', description: 'Basic Monthly Subscription', amount: 49, status: 'PAID', method: 'Visa ****4242', invoiceId: 'INV-2023-156' },
    { id: 3, date: '2023-12-05', description: 'Personal Training Session (5-pack)', amount: 150, status: 'PAID', method: 'Visa ****4242', invoiceId: 'INV-2023-145' },
    { id: 4, date: '2023-11-15', description: 'Basic Monthly Subscription', amount: 49, status: 'PAID', method: 'Visa ****4242', invoiceId: 'INV-2023-098' },
    { id: 5, date: '2023-10-15', description: 'Basic Monthly Subscription', amount: 49, status: 'PAID', method: 'Visa ****4242', invoiceId: 'INV-2023-056' },
  ];

  const upcomingCharges = [
    { id: 1, date: '2024-02-15', description: 'Basic Monthly Subscription', amount: 49 },
  ];

  const totalRevenue = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
  const averageMonthlySpend = Math.round(totalRevenue / 5); // Assuming 5 months

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push(`/dashboard/gym-owner/members/${memberId}`)}
            className="text-accent-blue-500 hover:text-accent-blue-700 font-medium mb-4 flex items-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Member Profile
          </button>

          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">Billing & Payments</h1>
            <p className="text-xs sm:text-sm text-foreground/60 mt-1">{member.name}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-card p-4 sm:p-6">
              <p className="text-xs sm:text-sm font-medium text-foreground/60">Total Revenue</p>
              <p className="text-2xl sm:text-3xl font-black text-foreground mt-2">${totalRevenue}</p>
              <p className="text-xs sm:text-sm text-primary-500 mt-1">Lifetime value</p>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl shadow-card p-4 sm:p-6">
              <p className="text-xs sm:text-sm font-medium text-foreground/60">Avg Monthly Spend</p>
              <p className="text-2xl sm:text-3xl font-black text-foreground mt-2">${averageMonthlySpend}</p>
              <p className="text-xs sm:text-sm text-foreground/60 mt-1">Last 5 months</p>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl shadow-card p-4 sm:p-6">
              <p className="text-xs sm:text-sm font-medium text-foreground/60">Next Billing</p>
              <p className="text-xl sm:text-2xl font-black text-foreground mt-2">{member.nextBillingDate}</p>
              <p className="text-xs sm:text-sm text-foreground/60 mt-1">$49 scheduled</p>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl shadow-card p-4 sm:p-6">
              <p className="text-xs sm:text-sm font-medium text-foreground/60">Payment Method</p>
              <p className="text-lg sm:text-xl font-bold text-foreground mt-2">{member.paymentMethod}</p>
              <p className="text-xs sm:text-sm text-foreground/60 mt-1">Default method</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment History */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg sm:rounded-xl shadow-card p-4 sm:p-6 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground">Payment History</h3>
                  <button className="text-accent-blue-500 hover:text-accent-blue-700 text-xs sm:text-sm font-medium whitespace-nowrap">
                    Export
                  </button>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-foreground/60">Date</th>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-foreground/60">Description</th>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-foreground/60">Amount</th>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-foreground/60">Method</th>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-foreground/60">Status</th>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-foreground/60">Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((payment) => (
                        <tr key={payment.id} className="border-b border-gray-100 last:border-0">
                          <td className="py-3 px-2 text-foreground/60 text-xs sm:text-sm">{payment.date}</td>
                          <td className="py-3 px-2 font-medium text-foreground text-xs sm:text-sm">{payment.description}</td>
                          <td className="py-3 px-2 font-semibold text-foreground text-xs sm:text-sm">${payment.amount}</td>
                          <td className="py-3 px-2 text-foreground/60 text-xs">{payment.method}</td>
                          <td className="py-3 px-2">
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                              {payment.status}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <button className="text-accent-blue-500 hover:text-accent-blue-700 text-xs font-medium">
                              {payment.invoiceId}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground text-xs sm:text-sm">{payment.description}</p>
                          <p className="text-xs text-foreground/60 mt-0.5">{payment.date}</p>
                        </div>
                        <p className="font-bold text-foreground ml-2">${payment.amount}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                        <div><span className="text-foreground/60">Method: </span>{payment.method}</div>
                        <div className="text-right">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                            {payment.status}
                          </span>
                        </div>
                      </div>
                      <button className="w-full text-left text-accent-blue-500 hover:text-accent-blue-700 text-xs font-medium">
                        {payment.invoiceId}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Charges */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow-card p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4">Upcoming Charges</h3>
                <div className="space-y-3">
                  {upcomingCharges.map((charge) => (
                    <div
                      key={charge.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg gap-3"
                    >
                      <div>
                        <p className="font-semibold text-foreground text-sm">{charge.description}</p>
                        <p className="text-xs text-foreground/60">Scheduled for {charge.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg sm:text-xl font-bold text-foreground">${charge.amount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Current Plan */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow-card p-4 sm:p-6 mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4">Current Plan</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-foreground/60">Plan</p>
                    <p className="text-foreground text-sm mt-1">{member.currentPlan}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-foreground/60">Next Billing Date</p>
                    <p className="text-foreground text-sm mt-1">{member.nextBillingDate}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-foreground/60">Payment Method</p>
                    <p className="text-foreground text-sm mt-1">{member.paymentMethod}</p>
                  </div>
                  <button className="w-full px-4 py-2 border-2 border-accent-blue-500 text-accent-blue-500 text-sm sm:text-base font-semibold rounded-lg hover:bg-accent-blue-50 mt-2">
                    Change Plan
                  </button>
                </div>
              </div>

              {/* Billing Actions */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow-card p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4">Billing Actions</h3>
                <div className="space-y-2 text-sm">
                  <button className="w-full px-4 py-2 text-left text-accent-blue-500 hover:bg-accent-blue-50 rounded-lg font-medium text-xs sm:text-sm">
                    Send Invoice
                  </button>
                  <button className="w-full px-4 py-2 text-left text-accent-blue-500 hover:bg-accent-blue-50 rounded-lg font-medium text-xs sm:text-sm">
                    Record Payment
                  </button>
                  <button className="w-full px-4 py-2 text-left text-accent-blue-500 hover:bg-accent-blue-50 rounded-lg font-medium text-xs sm:text-sm">
                    Apply Discount
                  </button>
                  <button className="w-full px-4 py-2 text-left text-accent-blue-500 hover:bg-accent-blue-50 rounded-lg font-medium text-xs sm:text-sm">
                    Update Payment Method
                  </button>
                  <button className="w-full px-4 py-2 text-left text-accent-blue-500 hover:bg-accent-blue-50 rounded-lg font-medium text-xs sm:text-sm">
                    Pause Subscription
                  </button>
                  <button className="w-full px-4 py-2 text-left text-red-500 hover:bg-red-50 rounded-lg font-medium text-xs sm:text-sm">
                    Cancel Subscription
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
