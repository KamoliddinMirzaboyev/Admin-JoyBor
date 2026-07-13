import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import BackButton from '../components/UI/BackButton';
import Skeleton from '../components/UI/Skeleton';
import ApplicationInfoCard from '../components/applications/ApplicationInfoCard';
import ApplicationActions from '../components/applications/ApplicationActions';
import api from '../data/api';
import { Application } from '../components/applications/types';

const ApplicationDetail: React.FC = () => {
  const { id } = useParams();

  const { data: application, isLoading, error, refetch } = useQuery<Application>({
    queryKey: ['application', id],
    queryFn: () => api.getApplication(id as string),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <Skeleton className="h-6 w-24 mb-6" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="text-center py-10 text-danger-600 dark:text-danger-400">
        Ariza topilmadi yoki yuklashda xatolik yuz berdi.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <BackButton />
      <ApplicationInfoCard application={application} />
      <ApplicationActions application={application} id={id as string} onChanged={() => refetch()} />
    </div>
  );
};

export default ApplicationDetail;
