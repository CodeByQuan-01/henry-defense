import React from "react";
import { Scanner } from "@yudiel/react-qr-scanner";

const SimpleQrScanner = ({ onScan }) => {
  return (
    <div>
      <Scanner
        onScan={(result) => onScan(result)}
        onError={(error) => console.error(error)}
        constraints={{ facingMode: "environment" }}
      />
    </div>
  );
};

export default SimpleQrScanner;
