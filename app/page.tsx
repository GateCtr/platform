import { redirect } from 'next/navigation';

export default function Home() {
  // Si la waitlist est activée, rediriger vers /waitlist
  if (process.env.ENABLE_WAITLIST === 'true') {
    redirect('/waitlist');
  }

  // Sinon, afficher la landing page
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-primary-700 dark:text-white mb-6">
          GateCtr
        </h1>
        <p className="text-xl text-grey-600 dark:text-grey-300 mb-8">
          Universal middleware hub for controlling, optimizing, and securing API calls to LLMs
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-grey-800 p-6 rounded-lg shadow-lg border border-grey-200 dark:border-grey-700">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-300 mb-2">
              Budget Firewall
            </h3>
            <p className="text-grey-600 dark:text-grey-400 text-sm">
              Set hard limits and soft alerts to control LLM costs
            </p>
          </div>
          
          <div className="bg-white dark:bg-grey-800 p-6 rounded-lg shadow-lg border border-grey-200 dark:border-grey-700">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-300 mb-2">
              Context Optimizer
            </h3>
            <p className="text-grey-600 dark:text-grey-400 text-sm">
              Reduce token usage by up to 40% with intelligent compression
            </p>
          </div>
          
          <div className="bg-white dark:bg-grey-800 p-6 rounded-lg shadow-lg border border-grey-200 dark:border-grey-700">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-300 mb-2">
              Model Router
            </h3>
            <p className="text-grey-600 dark:text-grey-400 text-sm">
              Automatically select the optimal LLM for each request
            </p>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <a
            href="/sign-up"
            className="bg-secondary-500 hover:bg-secondary-400 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-md"
          >
            Get Started
          </a>
          <a
            href="/sign-in"
            className="bg-white dark:bg-grey-800 text-primary-700 dark:text-white px-8 py-3 rounded-lg font-medium border-2 border-primary-500 hover:bg-primary-50 dark:hover:bg-grey-700 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
