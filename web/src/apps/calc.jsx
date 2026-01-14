import React from 'react';

const CalPrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy for Note Cal - Note Calculator</h1>
      <p className="text-sm text-gray-600 mb-8">Last Updated: December 2025</p>

      <p className="text-gray-700 mb-8">
        Note Cal - Note Calculator ("the App") is developed to help users
        calculate totals from note-based input. We value your privacy and are
        committed to ensuring your data remains safe.
      </p>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">1. Data Collection</h2>
        <p className="text-gray-700">
          The App does not collect, store, or transmit any personal information from your notes or calculations.
          All text you enter inside the App remains stored locally on your device only and is never shared with us or any third parties.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">2. Local Storage</h2>
        <p className="text-gray-700">
          If the App saves your notes for convenience, those notes stay on your
          device and are never uploaded to any server or third-party service.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">3. Internet Connection</h2>
        <p className="text-gray-700 mb-3">
          The App requires an internet connection to display advertisements. However, your notes and calculation data are never transmitted over the internet.
        </p>
        <p className="text-gray-700">
          With a premium subscription (ad-free), the App can function fully offline.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">4. Advertisements and Analytics</h2>
        <p className="text-gray-700 mb-3">
          The App displays advertisements to support its free availability. These ads are served by third-party advertising partners who may collect certain information to provide relevant ads.
        </p>
        <p className="text-gray-700 mb-3">
          <strong>Information collected by ad providers may include:</strong>
        </p>
        <ul className="list-disc ml-6 text-gray-700 mb-3">
          <li>Device identifiers (advertising ID)</li>
          <li>IP address and general location</li>
          <li>Ad interaction data</li>
        </ul>
        <p className="text-gray-700">
          You can opt out of personalized ads through your device settings or remove ads entirely by subscribing to our premium plans.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">5. Subscription Services</h2>
        <p className="text-gray-700 mb-3">
          The App offers optional subscription plans (monthly and yearly) to remove advertisements and enhance your experience.
        </p>
        <p className="text-gray-700 mb-3">
          <strong>Subscription information collected:</strong>
        </p>
        <ul className="list-disc ml-6 text-gray-700 mb-3">
          <li>Purchase transaction details (processed by app store platforms)</li>
          <li>Subscription status and renewal dates</li>
        </ul>
        <p className="text-gray-700">
          Payment processing is handled securely by Google Play Store or Apple App Store. We do not store your payment card information.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">6. Permissions</h2>
        <p className="text-gray-700">
          The App does not request access to device permissions such as contacts,
          camera, microphone, location, or storage beyond what is required for
          normal operational behavior on your device.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">7. Children's Privacy</h2>
        <p className="text-gray-700">
          The App does not knowingly collect personal data from children under 13.
          Since no personal information is collected, there is no risk of misuse.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">8. Changes to This Policy</h2>
        <p className="text-gray-700">
          We may update this Privacy Policy if app features change in the future
          (e.g., enabling cloud backup or invoice sharing). Any modifications will
          be reflected in this screen as well as on our published privacy policy
          webpage.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">9. Contact</h2>
        <p className="text-gray-700">
          If you have any questions or concerns about this Privacy Policy,
          you may contact us via email:
        </p>
        <p className="text-lg font-semibold mt-4 text-blue-600">support@notecalapp.com</p>
      </section>
    </div>
  );
};

export default CalPrivacyPolicy;
