import Link from 'next/link';

export default function TermsPage() {
  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: [
        {
          subtitle: '',
          text: 'By accessing or using Binectics\' services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing our services. The materials contained in this platform are protected by applicable copyright and trademark law.',
        },
      ],
    },
    {
      title: '2. Use License and Account Registration',
      content: [
        {
          subtitle: '2.1 Account Creation',
          text: 'You must create an account to use our services. You must be at least 18 years old to register. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.',
        },
        {
          subtitle: '2.2 Permitted Use',
          text: 'Permission is granted to temporarily access Binectics\' services for personal, non-commercial use only. You may not modify, copy, distribute, transmit, display, perform, reproduce, publish, license, create derivative works from, transfer, or sell any information or services obtained from our platform.',
        },
        {
          subtitle: '2.3 Prohibited Activities',
          text: 'You agree not to: (a) use our services for any illegal purpose; (b) attempt to gain unauthorized access to our systems; (c) interfere with or disrupt our services; (d) upload malicious code; (e) impersonate others; (f) harass, abuse, or harm other users; (g) violate any applicable laws or regulations.',
        },
      ],
    },
    {
      title: '3. Membership and Subscriptions',
      content: [
        {
          subtitle: '3.1 Subscription Plans',
          text: 'Binectics offers various subscription plans with different features and pricing. All subscriptions automatically renew unless canceled before the renewal date. You authorize us to charge your payment method for recurring subscription fees.',
        },
        {
          subtitle: '3.2 Free Trial',
          text: 'We may offer a free trial period for new members. After the trial period ends, you will be charged the applicable subscription fee unless you cancel before the trial expires. We reserve the right to modify or cancel free trials at any time.',
        },
        {
          subtitle: '3.3 Cancellation and Refunds',
          text: 'You may cancel your subscription at any time through your account settings. Cancellations take effect at the end of the current billing period. We offer a 30-day money-back guarantee on annual plans. Monthly subscriptions are non-refundable except as required by law.',
        },
        {
          subtitle: '3.4 Price Changes',
          text: 'We reserve the right to change subscription prices at any time. Price changes will be communicated at least 30 days in advance and will take effect at your next renewal date. Your continued use of our services after a price change constitutes acceptance of the new pricing.',
        },
      ],
    },
    {
      title: '4. Gym Access and Check-In',
      content: [
        {
          subtitle: '4.1 Partner Gyms',
          text: 'Access to partner gyms is subject to availability and the rules of each individual facility. Gyms reserve the right to deny access based on capacity, safety concerns, or facility rules. Binectics is not responsible for gym closures, schedule changes, or facility conditions.',
        },
        {
          subtitle: '4.2 QR Code Usage',
          text: 'Your QR code is personal and non-transferable. Sharing your QR code or allowing others to use your membership is strictly prohibited and may result in immediate termination of your account without refund.',
        },
        {
          subtitle: '4.3 Conduct at Facilities',
          text: 'You agree to follow all gym rules and regulations, treat staff and other members with respect, and use equipment safely and appropriately. Violations may result in being banned from specific facilities or termination of your Binectics membership.',
        },
      ],
    },
    {
      title: '5. Professional Services (Trainers and Dieticians)',
      content: [
        {
          subtitle: '5.1 Verification and Credentials',
          text: 'While we verify professional credentials, Binectics does not guarantee the quality, accuracy, or results of services provided by trainers and dieticians. You are responsible for evaluating professionals before booking sessions.',
        },
        {
          subtitle: '5.2 Professional-Client Relationship',
          text: 'The relationship is directly between you and the professional. Binectics facilitates bookings and payments but is not a party to the service agreement. Any disputes should be resolved directly with the professional.',
        },
        {
          subtitle: '5.3 Health and Safety',
          text: 'You acknowledge that physical training and dietary changes carry inherent risks. You should consult with your physician before beginning any fitness or nutrition program. You assume all risks associated with professional services booked through Binectics.',
        },
        {
          subtitle: '5.4 Cancellation Policies',
          text: 'Each professional sets their own cancellation policy. You are responsible for understanding and adhering to these policies. Failure to comply may result in charges or penalties.',
        },
      ],
    },
    {
      title: '6. For Fitness Professionals',
      content: [
        {
          subtitle: '6.1 Professional Obligations',
          text: 'If you operate as a gym owner, trainer, or dietician, you agree to: (a) maintain all required licenses and certifications; (b) comply with applicable laws and regulations; (c) provide accurate information about your services; (d) maintain professional liability insurance; (e) treat all clients with respect and professionalism.',
        },
        {
          subtitle: '6.2 Commission and Fees',
          text: 'Binectics charges commission fees on bookings as outlined in your service agreement. These fees cover platform usage, payment processing, and customer support. All fees are subject to change with 30 days notice.',
        },
        {
          subtitle: '6.3 Independent Contractor Status',
          text: 'Professionals on Binectics are independent contractors, not employees. You are responsible for your own taxes, insurance, and business expenses. Binectics does not withhold taxes or provide employee benefits.',
        },
      ],
    },
    {
      title: '7. Intellectual Property',
      content: [
        {
          subtitle: '7.1 Platform Content',
          text: 'All content on the Binectics platform, including text, graphics, logos, icons, images, audio clips, and software, is the property of Binectics or its licensors and is protected by copyright, trademark, and other intellectual property laws.',
        },
        {
          subtitle: '7.2 User Content',
          text: 'You retain ownership of content you submit to Binectics (photos, reviews, workout logs, etc.). By submitting content, you grant Binectics a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display your content in connection with our services.',
        },
        {
          subtitle: '7.3 Feedback',
          text: 'Any feedback, suggestions, or ideas you provide to Binectics become our property, and we may use them without compensation or obligation to you.',
        },
      ],
    },
    {
      title: '8. Disclaimer of Warranties',
      content: [
        {
          subtitle: '',
          text: 'Our services are provided "as is" and "as available" without any warranties of any kind, either express or implied. Binectics does not warrant that our services will be uninterrupted, secure, or error-free. We do not guarantee the accuracy, completeness, or usefulness of any information on our platform. You use our services at your own risk.',
        },
      ],
    },
    {
      title: '9. Limitation of Liability',
      content: [
        {
          subtitle: '',
          text: 'To the maximum extent permitted by law, Binectics shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or use, arising out of or related to your use of our services. Our total liability to you for any claims shall not exceed the amount you paid to Binectics in the 12 months preceding the claim.',
        },
      ],
    },
    {
      title: '10. Indemnification',
      content: [
        {
          subtitle: '',
          text: 'You agree to indemnify, defend, and hold harmless Binectics, its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses, including reasonable attorneys\' fees, arising out of or related to your use of our services, violation of these Terms, or violation of any rights of another.',
        },
      ],
    },
    {
      title: '11. Privacy and Data Protection',
      content: [
        {
          subtitle: '',
          text: 'Your use of our services is also governed by our Privacy Policy. We collect, use, and protect your personal information as described in our Privacy Policy. By using our services, you consent to our data practices as outlined in the Privacy Policy.',
        },
      ],
    },
    {
      title: '12. Modifications to Terms',
      content: [
        {
          subtitle: '',
          text: 'Binectics reserves the right to modify these Terms of Service at any time. We will notify you of material changes by posting an updated version on our website and updating the "Last Updated" date. Your continued use of our services after changes are posted constitutes acceptance of the modified Terms.',
        },
      ],
    },
    {
      title: '13. Termination',
      content: [
        {
          subtitle: '',
          text: 'We may terminate or suspend your account and access to our services immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use our services will immediately cease. All provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.',
        },
      ],
    },
    {
      title: '14. Governing Law and Dispute Resolution',
      content: [
        {
          subtitle: '14.1 Governing Law',
          text: 'These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.',
        },
        {
          subtitle: '14.2 Arbitration',
          text: 'Any dispute arising from these Terms or your use of our services shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. You waive your right to participate in a class action lawsuit or class-wide arbitration.',
        },
        {
          subtitle: '14.3 Exceptions',
          text: 'Either party may seek injunctive relief in court for intellectual property infringement or violations of confidentiality obligations.',
        },
      ],
    },
    {
      title: '15. Miscellaneous',
      content: [
        {
          subtitle: '15.1 Entire Agreement',
          text: 'These Terms, together with our Privacy Policy and any other legal notices published by Binectics, constitute the entire agreement between you and Binectics regarding our services.',
        },
        {
          subtitle: '15.2 Severability',
          text: 'If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.',
        },
        {
          subtitle: '15.3 Waiver',
          text: 'No waiver of any term of these Terms shall be deemed a further or continuing waiver of such term or any other term, and Binectics\' failure to assert any right or provision under these Terms shall not constitute a waiver of such right or provision.',
        },
        {
          subtitle: '15.4 Assignment',
          text: 'You may not assign or transfer these Terms or your rights hereunder without our prior written consent. Binectics may assign these Terms without restriction.',
        },
      ],
    },
    {
      title: '16. Contact Information',
      content: [
        {
          subtitle: '',
          text: 'If you have any questions about these Terms of Service, please contact us at:\n\nEmail: legal@binectics.com\nAddress: 100 Market Street, Suite 300, San Francisco, CA 94105\nPhone: +1 (555) 123-4567',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background-secondary">{/* Hero Section */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-black text-foreground sm:text-5xl lg:text-6xl">
            Terms of Service
          </h1>
          <p className="mt-6 text-lg text-foreground-secondary leading-relaxed">
            Last Updated: November 22, 2024
          </p>
          <p className="mt-4 text-base text-foreground-secondary leading-relaxed">
            Please read these Terms of Service carefully before using Binectics. By accessing or using
            our platform, you agree to be bound by these terms. If you disagree with any part of the
            terms, you may not access our services.
          </p>
        </div>
      </section>

      {/* Terms Content */}
      <section className="bg-neutral-100 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {sections.map((section, index) => (
              <div key={index} className="rounded-2xl bg-background p-8 sm:p-10 shadow-card">
                <h2 className="font-display text-2xl font-black text-foreground mb-6 sm:text-3xl">
                  {section.title}
                </h2>
                <div className="space-y-6">
                  {section.content.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      {item.subtitle && (
                        <h3 className="font-bold text-lg text-foreground mb-3">
                          {item.subtitle}
                        </h3>
                      )}
                      <p className="text-foreground-secondary leading-relaxed whitespace-pre-line">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="mt-12 rounded-2xl bg-primary-500 p-8 shadow-xl">
            <h3 className="font-display text-2xl font-black text-foreground mb-4">
              Related Documents
            </h3>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/privacy"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-background px-6 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-neutral-50"
              >
                Privacy Policy
              </Link>
              <Link
                href="/cookies"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-background px-6 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-neutral-50"
              >
                Cookie Policy
              </Link>
              <Link
                href="/security"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-background px-6 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-neutral-50"
              >
                Security
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
    </div>
  );
}
