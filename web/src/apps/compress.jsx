import React from 'react';

const CompressPrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy - PDF Compress App</h1>
      <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
      
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Introduction</h2>
        <p className="text-gray-700 mb-4">
          This privacy policy applies to the PDF Compress App ("App") developed by RobotPDF. 
          We respect your privacy and are committed to protecting your personal data.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Data Collection</h2>
        <p className="text-gray-700 mb-4">
          The PDF Compress App processes PDF files locally on your device to reduce file size. 
          We do not collect, store, or transmit any of your documents or personal information to our servers.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Permissions</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Storage: To read and save compressed PDF files</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Data Security</h2>
        <p className="text-gray-700 mb-4">
          All processing is done locally on your device. No data is transmitted to external servers.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
        <p className="text-gray-700">
          If you have any questions about this privacy policy, please contact us at support@robotpdf.com
        </p>
      </section>
    </div>
  );
};

export default CompressPrivacyPolicy;
