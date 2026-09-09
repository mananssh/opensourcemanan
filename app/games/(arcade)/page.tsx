import { listGames } from "@/lib/games/registry";
import { ArcadeHero } from "@/components/games/arcade-hero";
import { GameCatalog } from "@/components/games/game-catalog";

export default function GamesHomePage() {
  const games = listGames();

  return (
    <>
      <ArcadeHero />
      <GameCatalog games={games} />
    </>
  );
}
