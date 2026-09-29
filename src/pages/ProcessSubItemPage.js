import React from 'react';
import { useParams } from 'react-router-dom';

const ProcessSubItemPage = () => {
  const { itemName } = useParams();
  return (
    <div>
      <h1>Process Item Details</h1>
      <p>Displaying content for: <strong>{itemName}</strong></p>
    </div>
  );
};

export default ProcessSubItemPage;