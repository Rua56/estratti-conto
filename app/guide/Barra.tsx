export default function Barra() {
  return (
    <header className="barra">
      <a href="/" className="marchio">
        Estratti Conto
      </a>
      <nav className="menu" aria-label="Sezioni">
        <a href="/guide">Guide</a>
        <a href="/#prezzi">Prezzi</a>
        <a href="/#converti" className="menu-azione">
          Converti
        </a>
      </nav>
    </header>
  );
}
