import classNames from 'classnames';
import React from 'react';
import { capitalize, formatText } from '../../../helpers/utils';

const Status = ({
  withDot = false,
  icon = false,
  status = '',
  withDottedBorder = false,
  dotColor = null,
  statusText = null,
  statusTextClassName = 'font-12',
  statusWrapperClassName = '',
  sub_status = '',
  ...rest
}) => {
  

  const getStatusStyle = (status) => {
    switch (status) {
      case 'DRAFT':
        return {
          textColor: 'text-light-natural_700',
          dotColor: dotColor || 'bg-light-natural_150',
          bgColor: 'bg-light-natural_150',
        };
    
      case 'pending':
      case 'in_progress':
        return {
          textColor: 'text-light-orange_700',
          dotColor: dotColor || 'bg-light-orange_50',
          bgColor: 'bg-light-orange_50',
        };
    
      case 'success':
      case 'active':
        return {
          textColor: 'text-light-success_700',
          dotColor: dotColor || 'bg-light-success_50',
          bgColor: 'bg-light-success_50',
        };
      case 'rejected':
      case 'cancled':
      case 'inActivate':
        return {
          textColor: 'text-light-error_700',
          dotColor: dotColor || 'bg-light-error_50',
          bgColor: 'bg-light-error_50',
        };
     
      default:
        return {
          textColor: 'text-light-natural_700',
          dotColor: dotColor || 'bg-light-natural_50',
          bgColor: 'bg-light-natural_50',
        };
    }
  };

  const statusStyle = getStatusStyle(status);

  return (
    <div
      className={classNames(
        'flex items-center justify-center',
        'py-[2px] px-[10px] h-6 w-fit rounded-[18px]',
        statusStyle.bgColor,
        statusStyle.textColor,
        withDottedBorder && 'border border-dashed',
        statusWrapperClassName
      )}
      style={{
        ...(withDottedBorder && { 
          borderColor: dotColor || statusStyle.bgColor.replace('bg-', 'text-') 
        }),
        ...rest.style
      }}
      {...rest}
    >
   
      {withDot && (
        <div 
          className={classNames(
            'dot mr-1 h-1.5 w-1.5 rounded-full',
            statusStyle.dotColor
          )} 
        />
      )}
      <span className={classNames('status-text', statusTextClassName)}>
        {statusText ? statusText : capitalize(formatText(status))}
        {sub_status && (
          <span className="inter-400-text font-12 sub-status-text">{`: ${sub_status}`}</span>
        )}
      </span>
    </div>
  );
};

export default Status;