import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden relative" style={{ background: 'var(--bg-primary)' }}>
      {/* Enhanced Magical Orbs */}
      <div className="absolute top-0 w-full h-[500px] overflow-hidden pointer-events-none opacity-40 dark:opacity-20 z-0">
         <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full blur-[120px] bg-[var(--purple)] animate-pulse" style={{ animationDuration: '8s' }} />
         <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] bg-[var(--cyan)] animate-pulse" style={{ animationDuration: '12s' }} />
         <div className="absolute bottom-[-20%] left-[20%] w-[800px] h-[800px] rounded-full blur-[150px] bg-[var(--blue)] opacity-50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32 flex flex-col items-center">
        
        {/* Supreme Hero */}
        <div className="text-center max-w-4xl mx-auto mb-28 slide-up">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full mb-8 text-sm font-bold shadow-lg backdrop-blur-md transition-transform hover:scale-105"
               style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
            <span className="relative flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--green)' }}></span>
               <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: 'var(--green)' }}></span>
            </span>
            Meet Your Ultimate AI Digital Twin
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tighter text-[var(--text-primary)]">
            Stop guessing.<br />
            Know <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--cyan)] via-[var(--blue)] to-[var(--purple)]">You²</span>
          </h1>
          <p className="text-xl md:text-2xl mb-12 font-medium leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            An autonomous agent that flawlessly binds to your habits, predicts outcomes before they happen, and actively engineers your success.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Link href="/create-twin" className="group relative inline-flex items-center justify-center gap-2 text-lg font-bold px-10 py-5 rounded-2xl overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_rgba(6,182,212,0.3)]">
              <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-[var(--cyan)] to-[var(--blue)]"></span>
              <span className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-[var(--blue)] to-[var(--purple)]"></span>
              <span className="relative text-white flex items-center justify-center gap-2">Initialize Twin <span className="group-hover:translate-x-1 transition-transform">→</span></span>
            </Link>
            
            <Link href="/dashboard" className="group inline-flex items-center justify-center text-lg font-bold px-10 py-5 rounded-2xl transition-all hover:bg-[var(--surface2)]"
                  style={{ color: 'var(--text-primary)', border: '1px solid var(--border-color)', background: 'var(--surface)' }}>
              Open Dashboard
            </Link>
          </div>
        </div>

        {/* Next-Gen "How It Works" Section */}
        <div className="w-full mb-32 relative">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--blue)' }}>Architecture</h2>
            <h3 className="text-4xl md:text-5xl font-black text-[var(--text-primary)]">How <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--blue)] to-[var(--purple)]">You²</span> Works</h3>
          </div>
          
          <div className="relative">
            {/* Connecting Track Line (Desktop only) */}
            <div className="hidden lg:block absolute top-[52px] left-[10%] right-[10%] h-1 bg-[var(--border-color)] z-0 rounded-full">
              <div className="h-full bg-gradient-to-r from-[var(--cyan)] via-[var(--blue)] to-[var(--purple)] rounded-full animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10 w-full">
              {[
                { step: '01', icon: '🧬', title: 'Clone Mind', desc: 'Sync your daily habits and macro goals to initiate the baseline logic.' },
                { step: '02', icon: '⚡', title: 'Synthesize', desc: 'Gemini AI constructs an isolated environment predicting your exact choices.' },
                { step: '03', icon: '💬', title: 'Interrogate', desc: 'Chat directly with your twin to explore simulation fallouts and scenarios.' },
                { step: '04', icon: '📈', title: 'Feedback Loop', desc: 'The You² Extension streams live browser activity to adapt the twin dynamically.' },
              ].map((s, i) => (
                <div key={i} className="group relative flex flex-col items-center">
                  
                  {/* Icon Node */}
                  <div className="w-28 h-28 mb-8 rounded-full flex items-center justify-center relative transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-110 shadow-xl"
                       style={{ background: 'var(--surface)', border: '2px solid var(--border-color)' }}>
                    <div className="absolute inset-2 rounded-full flex items-center justify-center text-4xl"
                         style={{ background: 'var(--surface2)' }}>
                      {s.icon}
                    </div>
                    {/* Glowing outer ring on hover */}
                    <div className="absolute inset-[-4px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md -z-10"
                         style={{ background: i % 2 === 0 ? 'var(--cyan)' : 'var(--purple)' }}></div>
                    
                    {/* Step Badge */}
                    <div className="absolute -top-3 right-0 w-8 h-8 rounded-full font-black text-xs flex items-center justify-center text-white"
                         style={{ background: i % 2 === 0 ? 'var(--cyan)' : 'var(--purple)', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                      {s.step}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="glass-card p-6 rounded-2xl w-full text-center border transition-all duration-300 group-hover:bg-[var(--surface2)]"
                       style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
                    <h4 className="text-xl font-bold mb-3 text-[var(--text-primary)] tracking-tight">{s.title}</h4>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.desc}</p>
                  </div>

                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="w-full mb-32 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '🧠', title: 'Deep Reflection', short: 'Analyze why you do what you do.',
              desc: 'Cross-references your browsing habits to define psychological pitfalls.',
              gradient: 'from-[var(--purple)] to-[#c084fc]', 
            },
            {
              icon: '🔮', title: 'Simulations', short: 'A quantum leap in planning.',
              desc: 'Execute thousands of variable-driven scenarios seeing where your habits lead.',
              gradient: 'from-[var(--blue)] to-[#60a5fa]', 
            },
            {
              icon: '⚡', title: 'Hyper Action', short: 'Optimized execution.',
              desc: 'Generates non-forgiving, peak-optimized hour-by-hour schedules.',
              gradient: 'from-[var(--green)] to-[#34d399]', 
            },
          ].map((f, i) => (
             <div key={i} className="group relative overflow-hidden rounded-3xl p-8 border hover:-translate-y-2 transition-all duration-500"
                  style={{ borderColor: 'var(--border-color)', background: 'var(--surface)' }}>
               {/* Background Glow */}
               <div className={`absolute -right-20 -top-20 w-48 h-48 rounded-full blur-[80px] bg-gradient-to-br ${f.gradient} opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>
               
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-lg bg-gradient-to-br ${f.gradient} text-white`}>
                 {f.icon}
               </div>
               <h3 className="text-2xl font-black mb-2 text-[var(--text-primary)]">{f.title}</h3>
               <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{f.short}</p>
               <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
             </div>
          ))}
        </div>

        {/* Final CTA */}
        <div className="w-full rounded-[3rem] p-16 text-center relative overflow-hidden"
             style={{ border: '1px solid var(--border-color)', background: 'var(--surface)' }}>
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
          <div className="absolute -inset-10 blur-[100px] bg-gradient-to-r from-[var(--cyan)] to-[var(--blue)] opacity-10"></div>
          
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-[var(--text-primary)] tracking-tight relative z-10">Ascend Beyond Yourself.</h2>
          <p className="text-xl mb-10 max-w-xl mx-auto font-medium relative z-10" style={{ color: 'var(--text-secondary)' }}>
            The gap between who you are and who you want to be closes right here.
          </p>
          <Link
            href="/create-twin"
            className="relative z-10 inline-flex items-center justify-center gap-3 px-12 py-5 rounded-2xl text-xl font-bold transition-transform hover:scale-105 hover:shadow-2xl text-white"
            style={{ background: 'linear-gradient(135deg, var(--blue), var(--purple))' }}
          >
            Deploy Clone 🚀
          </Link>
        </div>

      </div>
    </div>
  );
}
