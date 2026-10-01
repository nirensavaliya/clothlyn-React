import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SiteChrome from "../../component/marketing/SiteChrome";
import { floorSteps, LOGIN_PATH, serviceGroups } from "../../component/marketing/siteContent";
import fabricBg from "../../assets/login/fabric-bg.png";

const highlights = serviceGroups.flatMap((group) =>
  group.items.slice(0, 1).map((item) => ({ ...item, kicker: group.kicker }))
);

const HomePage = () => {
  return (
    <SiteChrome>
      <section className="relative overflow-hidden border-b border-[#E8DFD4]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(247,243,238,0.2), rgba(247,243,238,0.92)), url(${fabricBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7D766C]">
              For clothing factories
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.12] tracking-tight text-[#0B1C30] sm:text-5xl">
              Every lot, scan, and salary — on one cloth.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#4C463D] sm:text-lg">
              Clothlyn is the system a garment unit uses on the floor and in the
              office. Open a lot, move it through process, scan it, then pay
              people from the work that was actually done.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to={LOGIN_PATH}
                className="inline-flex items-center gap-2 rounded-full bg-[#0B1C30] px-5 py-3 text-sm font-semibold text-[#FFFFFF] transition-colors hover:bg-[#16304d]"
              >
                Sign up
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center rounded-full border border-[#C5B396] bg-[#FFFFFF]/70 px-5 py-3 text-sm font-semibold text-[#0B1C30] transition-colors hover:border-[#7D766C]"
              >
                See services
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-[#E8DFD4] bg-[#F9F6F1]/90 p-6 shadow-[0_24px_50px_-28px_rgba(11,28,48,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7D766C]">
              A lot, from open to paid
            </p>
            <ol className="mt-5 space-y-4">
              {floorSteps.map((item) => (
                <li key={item.step} className="flex gap-4">
                  <span className="mt-0.5 w-8 shrink-0 text-sm font-semibold text-[#C5B396]">
                    {item.step}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#0B1C30]">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[#4C463D]">{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7D766C]">
              What the unit runs on
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Built around how a clothing floor already works.
            </h2>
          </div>
          <Link to="/services" className="text-sm font-semibold text-[#7D766C] hover:text-[#0B1C30]">
            All services →
          </Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-[#E8DFD4] bg-[#FFFFFF]/70 p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C5B396]">
                {item.kicker}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#4C463D]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#E8DFD4] bg-[#EFE7DC]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
          {[
            ["Floor", "Scan lots as they move. The register updates itself."],
            ["Office", "Designs, machines, members, and reports stay with the lot."],
            ["Pay", "Salary, advances, and paid records come from the same work."],
          ].map(([title, text]) => (
            <div key={title}>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#4C463D]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="rounded-[2rem] bg-[#0B1C30] px-6 py-12 text-[#F7F3EE] sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#C5B396]">
            Start with the login you already use
          </p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight">
            The workspace is the same. This site is the front door.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-[#E8DFD4]">
            Login and Sign up open the existing Clothlyn login. Your phone,
            OTP, and client code flow do not change.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={LOGIN_PATH}
              className="rounded-full bg-[#F7F3EE] px-5 py-3 text-sm font-semibold text-[#0B1C30]"
            >
              Login
            </Link>
            <Link
              to="/contact"
              className="rounded-full border border-[#C5B396] px-5 py-3 text-sm font-semibold text-[#F7F3EE]"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
};

export default HomePage;
