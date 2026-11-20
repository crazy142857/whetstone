import GatekeeperGame from "./GatekeeperGame";

export const metadata = { title: "Gatekeeper" };

export default async function Page(props) {
  const sp = await props.searchParams;
  const seed = typeof sp?.seed === "string" && /^[a-z0-9-]{1,32}$/i.test(sp.seed) ? sp.seed : null;
  return <GatekeeperGame challengeSeed={seed} />;
}
