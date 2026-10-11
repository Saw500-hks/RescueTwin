import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThreeDOpenPage from '../components/ThreeDOpenPage';

const IntroPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ThreeDOpenPage
      isStandalonePage={false}
      onEnter={() => navigate('/')}
    />
  );
};

export default IntroPage;
