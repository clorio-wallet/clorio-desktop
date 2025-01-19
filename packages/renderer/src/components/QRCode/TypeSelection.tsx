import React from 'react';
import {Camera, Upload} from 'react-feather';
import Disclaimer from './Disclaimer';

interface IProps {
  onCamera: () => void;
  onUpload: () => void;
}

export default function TypeSelection({onCamera, onUpload}: IProps) {
  return (
    <div>
      <h1>Select a method</h1>
      <hr />
      <Disclaimer />

      <div className="flex flex-row flex flex gap-4">
        {onCamera && (
          <div
            className="large-icon-button pt-5"
            onClick={onCamera}
          >
            <Camera className="large-icon" />
            <p className="mt-2">Camera</p>
          </div>
        )}
        {onUpload && (
          <div
            className="large-icon-button large-icon-button-red pt-5"
            onClick={onUpload}
          >
            <Upload className="large-icon" />
            <p className="mt-2">Upload</p>
          </div>
        )}
      </div>
    </div>
  );
}
