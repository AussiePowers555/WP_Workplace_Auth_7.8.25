
import { Suspense } from 'react';
import CasesListServer, { CasesListSkeleton } from './cases-list-server';

// ISR configuration - revalidate every 5 minutes (300 seconds)
export const revalidate = 300;

// Server component with ISR for optimized performance
export default function CasesPage() {
  return (
    <Suspense fallback={<CasesListSkeleton />}>
      <CasesListServer />
    </Suspense>
  );
}