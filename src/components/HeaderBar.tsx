import "./HeaderBar.css";

interface Props {
  onMethodologyClick: () => void;
}

export function HeaderBar({ onMethodologyClick }: Props) {
  return (
    <header className="header-bar">
      <div className="header-title">
        <span className="header-mark">Височините на сградите във Варна</span>
        <span className="header-sub">Оферта за проверка на съответствието с устройствените планове, подготвена за Община Варна</span>
      </div>
      <button className="header-meth" onClick={onMethodologyClick}>Източници и методология →</button>
    </header>
  );
}
