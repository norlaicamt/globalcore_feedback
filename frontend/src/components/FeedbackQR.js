// src/components/FeedbackQR.js
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

function FeedbackQR() {
  // This gets the current URL (e.g., http://localhost:3001)
  const currentUrl = window.location.href;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center text-center">
      <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
        Mobile Access
      </h3>
      
      <div className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <QRCodeSVG 
          value={currentUrl} 
          size={150}
          bgColor={"#ffffff"}
          fgColor={"#1e293b"} // Matches your slate-800 header
          level={"L"}
          includeMargin={false}
        />
      </div>

      <p className="mt-4 text-xs text-gray-500 leading-relaxed">
        Scan this code with a smartphone to <br />
        <span className="font-semibold text-blue-600">submit feedback on the go.</span>
      </p>
    </div>
  );
}

export default FeedbackQR;