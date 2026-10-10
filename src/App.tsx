// import { useState } from "react";
// import "./styles/app.css";
// import { Header, Sidebar } from "./components/Layout";
// import { InputBar, ChapterContent } from "./components/Workspace";
// import { AnalysisPanel } from "./components/Analysis";
// import { HistoryPage } from "./components/History";
// import { SettingsPage } from "./components/Settings";
// import { Landing } from "./components/Landing";
// import { AppProvider } from "./utils/AppContext";
// import { UserProvider, useUser } from "./utils/UserContext";

// function Shell() {
//   const { profile } = useUser();
//   const [active, setActive] = useState("Home");

//   if (!profile) return <Landing />;

//   const isWide = active === "History" || active === "Settings";

//   return (
//     <AppProvider>
//       <div className="cc-app">
//         <Header onProfileClick={() => setActive("Settings")} />
//         <div className={`cc-body${isWide ? " cc-body-wide" : ""}`}>
//           <Sidebar active={active} onSelect={setActive} />
//           <main className="cc-main">
//             {active === "History" && <HistoryPage onOpen={() => setActive("Home")} />}
//             {active === "Settings" && <SettingsPage onOpenHistory={() => setActive("History")} />}
//             {active === "Home" && (
//               <>
//                 <InputBar />
//                 <ChapterContent />
//               </>
//             )}
//           </main>
//           {!isWide && <AnalysisPanel />}
//         </div>
//       </div>
//     </AppProvider>
//   );
// }

// export default function App() {
//   return (
//     <UserProvider>
//       <Shell />
//     </UserProvider>
//   );
// }

// // import { useState } from "react";
// import { useState, useEffect } from "react";
// import "./styles/app.css";
// import { Header, Sidebar } from "./components/Layout";
// import { InputBar, ChapterContent } from "./components/Workspace";
// import { AnalysisPanel } from "./components/Analysis";
// import { HistoryPage } from "./components/History";
// import { SettingsPage } from "./components/Settings";
// import { Landing } from "./components/Landing";
// import { AppProvider } from "./utils/AppContext";
// import { UserProvider, useUser } from "./utils/UserContext";

// function Shell() {
//   const { profile } = useUser();
//   const [active, setActive] = useState("Home");

//   // Reset the view and scroll position whenever the user logs in or out
//   useEffect(() => {
//     setActive("Home");
//     window.scrollTo(0, 0);
//   }, [profile]);

//   if (!profile) return <Landing />;


//   const isWide = active === "History" || active === "Settings";

//   return (
//     <AppProvider>
//       <div className="cc-app">
//         <Header onProfileClick={() => setActive("Settings")} />
//         <div className={`cc-body${isWide ? " cc-body-wide" : ""}`}>
//           <Sidebar active={active} onSelect={setActive} />
//           <main className="cc-main">
//             {active === "History" && <HistoryPage onOpen={() => setActive("Home")} />}
//             {active === "Settings" && <SettingsPage onOpenHistory={() => setActive("History")} />}
//             {active === "Home" && (
//               <>
//                 <InputBar />
//                 <ChapterContent />
//               </>
//             )}
//           </main>
//           {!isWide && <AnalysisPanel />}
//         </div>
//       </div>
//     </AppProvider>
//   );
// }

// export default function App() {
//   return (
//     <UserProvider>
//       <Shell />
//     </UserProvider>
//   );
// }

// import { BookOpen, Moon, Sun, Home, History, Settings } from "lucide-react";
// import { useUser } from "../utils/UserContext";

// export function Header({ onProfileClick }: { onProfileClick: () => void }) {
//   const { profile, theme, toggleTheme } = useUser();
//   const isDark = theme === "dark";
//   const initial = (profile?.name.trim()[0] ?? "?").toUpperCase();

//   return (
//     <header className="cc-header">
//       <div className="cc-brand">
//         <BookOpen size={22} strokeWidth={1.6} />
//         <span className="cc-name">ChapterCheck</span>
//         <span className="cc-beta">Beta</span>
//         <span className="cc-divider" />
//         <span className="cc-tagline">Read Better. Write Smarter.</span>
//       </div>
//       <div className="cc-header-right">
//         <button
//           className="cc-icon-btn"
//           aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
//           title={isDark ? "Switch to light theme" : "Switch to dark theme"}
//           onClick={toggleTheme}
//           type="button"
//         >
//           {isDark ? <Sun size={17} strokeWidth={1.6} /> : <Moon size={17} strokeWidth={1.6} />}
//         </button>
//         <button
//           type="button"
//           className="cc-profile"
//           onClick={onProfileClick}
//           title={profile?.email}
//           aria-label="Open settings"
//         >
//           <span className="cc-profile-name">{profile?.name}</span>
//           <span className="cc-avatar">{initial}</span>
//         </button>
//       </div>
//     </header>
//   );
// }

// const items = [
//   { label: "Home", Icon: Home },
//   { label: "History", Icon: History },
//   { label: "Settings", Icon: Settings },
// ];

// export function Sidebar({ active, onSelect }: { active: string; onSelect: (s: string) => void }) {
//   return (
//     <aside className="cc-sidebar">
//       <nav>
//         {items.map(({ label, Icon }) => (
//           <button key={label} className={`cc-nav ${active === label ? "is-active" : ""}`} onClick={() => onSelect(label)}>
//             <Icon size={18} strokeWidth={1.6} />
//             <span>{label}</span>
//           </button>
//         ))}
//       </nav>
//       <p className="cc-motto">Better comprehension builds better thinkers.</p>
//     </aside>
//   );
// }

import { useState, useEffect } from "react";
import "./styles/app.css";
import { Header, Sidebar } from "./components/Layout";
import { InputBar, ChapterContent } from "./components/Workspace";
import { AnalysisPanel } from "./components/Analysis";
import { HistoryPage } from "./components/History";
import { SettingsPage } from "./components/Settings";
import { Landing } from "./components/Landing";
import { AppProvider } from "./utils/AppContext";
import { UserProvider, useUser } from "./utils/UserContext";

function Shell() {
  const { profile } = useUser();
  const [active, setActive] = useState("Home");

  // Reset the view and scroll position whenever the user logs in or out
  useEffect(() => {
    setActive("Home");
    window.scrollTo(0, 0);
  }, [profile]);

  if (!profile) return <Landing />;

  const isWide = active === "History" || active === "Settings";

  return (
    <AppProvider>
      <div className="cc-app">
        <Header onProfileClick={() => setActive("Settings")} />
        <div className={`cc-body${isWide ? " cc-body-wide" : ""}`}>
          <Sidebar active={active} onSelect={setActive} />
          <main className="cc-main">
            {active === "History" && <HistoryPage onOpen={() => setActive("Home")} />}
            {active === "Settings" && <SettingsPage onOpenHistory={() => setActive("History")} />}
            {active === "Home" && (
              <>
                <InputBar />
                <ChapterContent />
              </>
            )}
          </main>
          {!isWide && <AnalysisPanel />}
        </div>
      </div>
    </AppProvider>
  );
}

export default function App() {
  return (
    <UserProvider>
      <Shell />
    </UserProvider>
  );
}