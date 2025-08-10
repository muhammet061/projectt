import React from 'react';
import Layout from '../components/Layout';
import FileUploader from '../components/FileUploader';
import FileList from '../components/FileList';

const Dashboard: React.FC = () => {
  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="space-y-8">
          <FileUploader />
          <FileList />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;