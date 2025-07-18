import React from 'react';
import Hero from '../components/Home/Hero';
import RecentActivity from '../components/Home/RecentActivity';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Hero />
      <RecentActivity />
    </div>
  );
};

export default Home;