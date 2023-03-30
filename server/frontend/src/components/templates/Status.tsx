// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Helper components to display status messages, progress bars, etc.
 */

import React from 'react';

/**
 * Progress bar component. Uses materialize progress bar to define progress. The
 * bar is determinate if the width prop is defined, else indeterminiate.
 */

type ProgressBarProps = {
  percentage?: number;
  width?: string;
};

export const ProgressBar = (props: ProgressBarProps) => {
  const { percentage, width } = props;
  const progressWidth = width ? width : 's12';
  return (
    <div className='row'>
      <div className={`col ${progressWidth}`}>
        {percentage ? (
          <div className='progress'>
            <div className='determinate' style={{ width: `${percentage}%` }}></div>
          </div>
        ) : (
          <div className='progress'>
            <div className='indeterminate'></div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Error message component. Display a message in red-text inside a section.
 */

type ErrorMessageProps = {
  message: string[];
};

export const ErrorMessage = (props: ErrorMessageProps) => {
  const message = props.message || ['Error occured in an unknown path'];
  return <div className='section red-text'>{message.join(',')}</div>;
};

type ErrorMessageWithRetryProps = ErrorMessageProps & {
  onRetry: () => void;
};

export const ErrorMessageWithRetry = (props: ErrorMessageWithRetryProps) => {
  const message = props.message || ['Error occured in an unknown path'];
  return (
    <div>
      <ErrorMessage message={message} />
      <div>
        <button className='btn grey bmar20'>Retry</button>
      </div>
    </div>
  );
};
