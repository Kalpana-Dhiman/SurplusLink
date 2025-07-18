import React from 'react';
import DonateForm from '../components/Donate/DonateForm';

const Donate: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-32">
      <DonateForm />
    </div>
  );
};

export default Donate;