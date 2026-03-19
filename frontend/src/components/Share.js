import { QRCodeSVG } from 'qrcode.react';

function FeedbackQRCode({ url }) {
  return (
    <div className="flex flex-col items-center p-4 bg-white border rounded-xl shadow-sm">
      <p className="text-sm font-bold mb-2 text-gray-700">Scan to Submit Feedback</p>
      <QRCodeSVG value={url} size={128} />
      <p className="text-xs text-gray-400 mt-2">{url}</p>
    </div>
  );
}