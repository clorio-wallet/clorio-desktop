import React from 'react';
import {AlertOctagon} from 'react-feather';

export default function ZkappConnectDisclaimer({alt}: {alt?: boolean}) {
  return alt ? (
    <div
      className="alert alert-warning flex flex-row items-center justify-start gap-2"
      role="alert"
    >
      <AlertOctagon />
      <p className="small m-0">
        Connect only to trusted zkapps. <br />
        Do not enter your private keys on untrusted sites.
      </p>
    </div>
  ) : (
    <div
      className="alert alert-warning flex flex-row items-center gap-2"
      role="alert"
    >
      <AlertOctagon />
      <p className="small m-0">{'For security reasons connect only to trusted zkapps'}</p>
    </div>
  );
}
