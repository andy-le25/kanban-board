import type { Metadata } from 'next'; 
import AboutClient from './AboutClient';

export const metadata: Metadata = {
  title: 'About - Kanban Board',
  description: 'Learn more about My Website, our mission, and our team.',
};

export default function AboutPage() {
  return ( 
    <main className = "flex flex-col items-center justify-center min-h-screen py-2"> 
        <AboutClient />
    </main>
  );
}