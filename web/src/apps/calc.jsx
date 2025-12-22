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
          The App does not collect, store, or transmit any personal information.
          All text you enter inside the App remains stored locally on your device
          only.
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
        <h2 className="text-2xl font-semibold mb-3">3. No Internet Data Transfer</h2>
        <p className="text-gray-700">
          The App does not send any data to the internet. It works offline and has
          no functionality that requires your data to leave the device.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">4. No Ads or Analytics</h2>
        <p className="text-gray-700">
          The App currently does not display advertisements, use analytics tools,
          or integrate with any tracking SDKs.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">5. Permissions</h2>
        <p className="text-gray-700">
          The App does not request access to device permissions such as contacts,
          camera, microphone, location, or storage beyond what is required for
          normal operational behavior on your device.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">6. Children's Privacy</h2>
        <p className="text-gray-700">
          The App does not knowingly collect personal data from children under 13.
          Since no personal information is collected, there is no risk of misuse.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">7. Changes to This Policy</h2>
        <p className="text-gray-700">
          We may update this Privacy Policy if app features change in the future
          (e.g., enabling cloud backup or invoice sharing). Any modifications will
          be reflected in this screen as well as on our published privacy policy
          webpage.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">8. Contact</h2>
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
