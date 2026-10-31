import { useState } from 'react';
import { Input, Label } from '@/components/ui/input';

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

export function PositionSizer() {
  const [account, setAccount] = useState(100000);
  const [risk, setRisk] = useState(1);
  const [stop, setStop] = useState(5);
  const atRisk = (account * risk) / 100;
  const size = stop > 0 ? atRisk / (stop / 100) : 0;
  const share = account > 0 ? (size / account) * 100 : 0;
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="calc-account">Account ₹</Label>
          <Input
            id="calc-account"
            inputMode="numeric"
            value={account}
            onChange={(e) =>
              setAccount(Math.max(0, Number(e.target.value.replace(/\D/g, '')) || 0))
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="calc-risk">Risk %</Label>
          <Input
            id="calc-risk"
            type="number"
            min={0.1}
            max={10}
            step={0.5}
            value={risk}
            onChange={(e) => setRisk(Math.max(0, Number(e.target.value)))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="calc-stop">Exit %</Label>
          <Input
            id="calc-stop"
            type="number"
            min={0.5}
            max={50}
            step={0.5}
            value={stop}
            onChange={(e) => setStop(Math.max(0, Number(e.target.value)))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2" aria-live="polite">
        <div className="rounded-lg bg-muted/60 p-3">
          <div className="text-[11px] text-muted-foreground">Position size</div>
          <div className="font-mono text-lg font-semibold">{inr(size)}</div>
          <div className="text-[11px] text-muted-foreground">{share.toFixed(0)}% of account</div>
        </div>
        <div className="rounded-lg bg-muted/60 p-3">
          <div className="text-[11px] text-muted-foreground">Planned loss if exit hits</div>
          <div className="font-mono text-lg font-semibold text-loss">−{inr(atRisk)}</div>
          <div className="text-[11px] text-muted-foreground">Gaps can make it larger</div>
        </div>
      </div>
      {share > 100 && (
        <p className="text-[11px] text-warn">
          Bigger than the account: this would need leverage. Widen the exit or lower the risk.
        </p>
      )}
      <p className="mt-auto text-[11px] text-muted-foreground">
        Size = amount at risk ÷ distance to your exit. Illustrative arithmetic, not advice.
      </p>
    </div>
  );
}

