/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import TournamentCreation from './components/TournamentCreation';
import TournamentManage from './components/TournamentManage';
import TeamsRoster from './components/TeamsRoster';
import AthletesRoster from './components/AthletesRoster';
import DivisionDraw from './components/DivisionDraw';
import ScheduleManager from './components/ScheduleManager';
import Leaderboard from './components/Leaderboard';
import NewsFeed from './components/NewsFeed';
import SponsorsSect from './components/SponsorsSect';
import AdminDashboard from './components/AdminDashboard';
import { Trophy } from 'lucide-react';

function TournamentAppContent() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const { tournaments, activeTournamentId } = useTournament();

  const activeTourney = tournaments.find(t => t.id === activeTournamentId) || tournaments[0];
  const activeTournamentName = activeTourney ? activeTourney.name : 'Chưa chọn';

  const navigateToPost = (postId: string) => {
    setSelectedPostId(postId);
    setCurrentTab('news');
  };

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'home':
        return <HomeView setCurrentTab={setCurrentTab} onPostClick={navigateToPost} />;
      case 'tournament-create':
        return <TournamentCreation setCurrentTab={setCurrentTab} />;
      case 'tournament-manage':
        return <TournamentManage />;
      case 'teams':
        return <TeamsRoster />;
      case 'athletes':
        return <AthletesRoster />;
      case 'draw':
        return <DivisionDraw />;
      case 'schedule':
        return <ScheduleManager />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'news':
        return <NewsFeed selectedPostId={selectedPostId} setSelectedPostId={setSelectedPostId} />;
      case 'sponsors':
        return <SponsorsSect />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <HomeView setCurrentTab={setCurrentTab} onPostClick={navigateToPost} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row antialiased font-sans">
      {/* Sidebar Navigation */}
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} activeTournamentName={activeTournamentName} />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-h-screen lg:h-screen lg:overflow-hidden">
        {/* Top Header Row removed as per user request */}

        {/* Primary visual canvas body scroll frame */}
        <main className="flex-grow overflow-y-auto p-4 md:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {renderActiveTab()}
          </div>
        </main>

        {/* Dynamic metadata status footer centered */}
        <footer className="h-12 bg-white border-t border-slate-200 px-6 md:px-8 flex items-center justify-center text-[11px] text-slate-500 shrink-0">
          <div>
            <span className="font-semibold text-slate-700 select-none">© 2026 SmashManager Pro • Sleek UI v1.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <TournamentProvider>
      <TournamentAppContent />
    </TournamentProvider>
  );
}

