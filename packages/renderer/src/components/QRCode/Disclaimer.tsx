import React from 'react';
import {AlertOctagon} from 'react-feather';

export default function Disclaimer() {
  return (
    <div
      className="alert alert-warning zkapp-warning-alert"
      role="alert"
    >
      <AlertOctagon />
      <p className="m-0">
        Use QR codes only from trusted sources. Scanning a malicious QR code can compromise your
        security.
      </p>
    </div>
  );
}
