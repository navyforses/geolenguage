import React, { useState, useMemo } from 'react';
import { Calculator, Shield, Target, TrendingDown, DollarSign, Percent, AlertTriangle, Info } from 'lucide-react';

/**
 * რისკის მართვის ინსტრუმენტები
 * Stop-Loss, Position Size, Risk/Reward კალკულატორები
 */
export default function RiskManagement() {
  // Stop-Loss Calculator State
  const [stopLoss, setStopLoss] = useState({
    entryPrice: '',
    stopPrice: '',
    positionSize: '',
    direction: 'long' // long or short
  });

  // Position Size Calculator State
  const [positionSize, setPositionSize] = useState({
    accountSize: '',
    riskPercent: '2',
    entryPrice: '',
    stopPrice: ''
  });

  // Risk/Reward Calculator State
  const [riskReward, setRiskReward] = useState({
    entryPrice: '',
    stopPrice: '',
    targetPrice: ''
  });

  // Stop-Loss Calculation
  const stopLossResult = useMemo(() => {
    const entry = parseFloat(stopLoss.entryPrice);
    const stop = parseFloat(stopLoss.stopPrice);
    const size = parseFloat(stopLoss.positionSize);

    if (!entry || !stop || !size) return null;

    let priceDiff, lossPercent;

    if (stopLoss.direction === 'long') {
      priceDiff = entry - stop;
      lossPercent = ((entry - stop) / entry) * 100;
    } else {
      priceDiff = stop - entry;
      lossPercent = ((stop - entry) / entry) * 100;
    }

    const totalLoss = priceDiff * size;

    return {
      priceDiff: Math.abs(priceDiff).toFixed(2),
      lossPercent: Math.abs(lossPercent).toFixed(2),
      totalLoss: Math.abs(totalLoss).toFixed(2),
      isValid: stopLoss.direction === 'long' ? stop < entry : stop > entry
    };
  }, [stopLoss]);

  // Position Size Calculation
  const positionSizeResult = useMemo(() => {
    const account = parseFloat(positionSize.accountSize);
    const risk = parseFloat(positionSize.riskPercent);
    const entry = parseFloat(positionSize.entryPrice);
    const stop = parseFloat(positionSize.stopPrice);

    if (!account || !risk || !entry || !stop) return null;

    const riskAmount = account * (risk / 100);
    const stopDistance = Math.abs(entry - stop);
    const shares = Math.floor(riskAmount / stopDistance);
    const actualRisk = shares * stopDistance;

    return {
      riskAmount: riskAmount.toFixed(2),
      stopDistance: stopDistance.toFixed(2),
      shares: shares,
      actualRisk: actualRisk.toFixed(2),
      totalPosition: (shares * entry).toFixed(2)
    };
  }, [positionSize]);

  // Risk/Reward Calculation
  const riskRewardResult = useMemo(() => {
    const entry = parseFloat(riskReward.entryPrice);
    const stop = parseFloat(riskReward.stopPrice);
    const target = parseFloat(riskReward.targetPrice);

    if (!entry || !stop || !target) return null;

    const risk = Math.abs(entry - stop);
    const reward = Math.abs(target - entry);
    const ratio = reward / risk;
    const riskPercent = (risk / entry) * 100;
    const rewardPercent = (reward / entry) * 100;

    return {
      risk: risk.toFixed(2),
      reward: reward.toFixed(2),
      ratio: ratio.toFixed(2),
      riskPercent: riskPercent.toFixed(2),
      rewardPercent: rewardPercent.toFixed(2),
      isGood: ratio >= 2
    };
  }, [riskReward]);

  return (
    <div className="space-y-8">
      {/* სათაური */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary-400" />
          რისკის მართვა
        </h1>
        <p className="text-dark-400 mt-2">
          პროფესიონალური ინსტრუმენტები თქვენი კაპიტალის დასაცავად
        </p>
      </div>

      {/* რჩევების ბანერი */}
      <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-primary-300">რისკის მართვის ოქროს წესები</h4>
            <ul className="text-sm text-dark-300 mt-2 space-y-1">
              <li>• არასოდეს რისკავთ თქვენი კაპიტალის 1-2%-ზე მეტს ერთ ტრეიდში</li>
              <li>• ყოველთვის გამოიყენეთ stop-loss შეკვეთები</li>
              <li>• მინიმალური Risk/Reward თანაფარდობა უნდა იყოს 1:2</li>
              <li>• დივერსიფიცირება შეამცირებს მთლიან რისკს</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Stop-Loss კალკულატორი */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Stop-Loss კალკულატორი</h3>
              <p className="text-sm text-dark-400">გამოთვალეთ პოტენციური ზარალი</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Direction Toggle */}
            <div>
              <label className="text-sm text-dark-400 block mb-2">პოზიციის მიმართულება</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setStopLoss(s => ({ ...s, direction: 'long' }))}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    stopLoss.direction === 'long'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                      : 'bg-dark-700 text-dark-400 border border-dark-600'
                  }`}
                >
                  Long (ყიდვა)
                </button>
                <button
                  onClick={() => setStopLoss(s => ({ ...s, direction: 'short' }))}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    stopLoss.direction === 'short'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                      : 'bg-dark-700 text-dark-400 border border-dark-600'
                  }`}
                >
                  Short (გაყიდვა)
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-dark-400 block mb-1">შესვლის ფასი ($)</label>
              <input
                type="number"
                value={stopLoss.entryPrice}
                onChange={(e) => setStopLoss(s => ({ ...s, entryPrice: e.target.value }))}
                className="input w-full"
                placeholder="მაგ: 150.00"
              />
            </div>

            <div>
              <label className="text-sm text-dark-400 block mb-1">Stop-Loss ფასი ($)</label>
              <input
                type="number"
                value={stopLoss.stopPrice}
                onChange={(e) => setStopLoss(s => ({ ...s, stopPrice: e.target.value }))}
                className="input w-full"
                placeholder="მაგ: 145.00"
              />
            </div>

            <div>
              <label className="text-sm text-dark-400 block mb-1">აქციების რაოდენობა</label>
              <input
                type="number"
                value={stopLoss.positionSize}
                onChange={(e) => setStopLoss(s => ({ ...s, positionSize: e.target.value }))}
                className="input w-full"
                placeholder="მაგ: 100"
              />
            </div>

            {stopLossResult && (
              <div className={`p-4 rounded-lg ${stopLossResult.isValid ? 'bg-dark-700' : 'bg-red-500/10 border border-red-500/30'}`}>
                {!stopLossResult.isValid && (
                  <div className="flex items-center gap-2 text-red-400 text-sm mb-3">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Stop ფასი არასწორია პოზიციის მიმართულებისთვის</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-dark-400">ფასის სხვაობა:</span>
                    <p className="text-white font-medium">${stopLossResult.priceDiff}</p>
                  </div>
                  <div>
                    <span className="text-dark-400">პროცენტი:</span>
                    <p className="text-white font-medium">{stopLossResult.lossPercent}%</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-dark-600">
                    <span className="text-dark-400">პოტენციური ზარალი:</span>
                    <p className="text-2xl font-bold text-red-400">${stopLossResult.totalLoss}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* პოზიციის ზომის კალკულატორი */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">პოზიციის ზომა</h3>
              <p className="text-sm text-dark-400">რამდენი აქცია იყიდოთ</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-dark-400 block mb-1">ანგარიშის ზომა ($)</label>
              <input
                type="number"
                value={positionSize.accountSize}
                onChange={(e) => setPositionSize(s => ({ ...s, accountSize: e.target.value }))}
                className="input w-full"
                placeholder="მაგ: 10000"
              />
            </div>

            <div>
              <label className="text-sm text-dark-400 block mb-1">რისკი (%)</label>
              <div className="flex gap-2">
                {['1', '2', '3', '5'].map(val => (
                  <button
                    key={val}
                    onClick={() => setPositionSize(s => ({ ...s, riskPercent: val }))}
                    className={`px-3 py-1.5 rounded text-sm ${
                      positionSize.riskPercent === val
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-700 text-dark-300'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
                <input
                  type="number"
                  value={positionSize.riskPercent}
                  onChange={(e) => setPositionSize(s => ({ ...s, riskPercent: e.target.value }))}
                  className="input flex-1 text-center"
                  placeholder="%"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-dark-400 block mb-1">შესვლის ფასი ($)</label>
              <input
                type="number"
                value={positionSize.entryPrice}
                onChange={(e) => setPositionSize(s => ({ ...s, entryPrice: e.target.value }))}
                className="input w-full"
                placeholder="მაგ: 150.00"
              />
            </div>

            <div>
              <label className="text-sm text-dark-400 block mb-1">Stop-Loss ფასი ($)</label>
              <input
                type="number"
                value={positionSize.stopPrice}
                onChange={(e) => setPositionSize(s => ({ ...s, stopPrice: e.target.value }))}
                className="input w-full"
                placeholder="მაგ: 145.00"
              />
            </div>

            {positionSizeResult && (
              <div className="p-4 rounded-lg bg-dark-700">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-dark-400">რისკის თანხა:</span>
                    <p className="text-white font-medium">${positionSizeResult.riskAmount}</p>
                  </div>
                  <div>
                    <span className="text-dark-400">Stop დისტანცია:</span>
                    <p className="text-white font-medium">${positionSizeResult.stopDistance}</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-dark-600">
                    <span className="text-dark-400">რეკომენდებული აქციები:</span>
                    <p className="text-2xl font-bold text-blue-400">{positionSizeResult.shares} ცალი</p>
                  </div>
                  <div>
                    <span className="text-dark-400">პოზიციის ღირებულება:</span>
                    <p className="text-white font-medium">${positionSizeResult.totalPosition}</p>
                  </div>
                  <div>
                    <span className="text-dark-400">რეალური რისკი:</span>
                    <p className="text-white font-medium">${positionSizeResult.actualRisk}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Risk/Reward კალკულატორი */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">რისკი / მოგება</h3>
              <p className="text-sm text-dark-400">R:R თანაფარდობის გამოთვლა</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-dark-400 block mb-1">შესვლის ფასი ($)</label>
              <input
                type="number"
                value={riskReward.entryPrice}
                onChange={(e) => setRiskReward(s => ({ ...s, entryPrice: e.target.value }))}
                className="input w-full"
                placeholder="მაგ: 150.00"
              />
            </div>

            <div>
              <label className="text-sm text-dark-400 block mb-1">Stop-Loss ფასი ($)</label>
              <input
                type="number"
                value={riskReward.stopPrice}
                onChange={(e) => setRiskReward(s => ({ ...s, stopPrice: e.target.value }))}
                className="input w-full"
                placeholder="მაგ: 145.00"
              />
            </div>

            <div>
              <label className="text-sm text-dark-400 block mb-1">მიზნობრივი ფასი ($)</label>
              <input
                type="number"
                value={riskReward.targetPrice}
                onChange={(e) => setRiskReward(s => ({ ...s, targetPrice: e.target.value }))}
                className="input w-full"
                placeholder="მაგ: 165.00"
              />
            </div>

            {riskRewardResult && (
              <div className="p-4 rounded-lg bg-dark-700">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-dark-400">რისკი:</span>
                    <p className="text-red-400 font-medium">${riskRewardResult.risk} ({riskRewardResult.riskPercent}%)</p>
                  </div>
                  <div>
                    <span className="text-dark-400">მოგება:</span>
                    <p className="text-green-400 font-medium">${riskRewardResult.reward} ({riskRewardResult.rewardPercent}%)</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-dark-600">
                    <span className="text-dark-400">R:R თანაფარდობა:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <p className={`text-2xl font-bold ${riskRewardResult.isGood ? 'text-green-400' : 'text-yellow-400'}`}>
                        1 : {riskRewardResult.ratio}
                      </p>
                      {riskRewardResult.isGood ? (
                        <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs">კარგია</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-xs">სუსტია</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Visual Bar */}
                <div className="mt-4">
                  <div className="flex h-4 rounded overflow-hidden">
                    <div
                      className="bg-red-500/50"
                      style={{ width: `${100 / (1 + parseFloat(riskRewardResult.ratio))}%` }}
                    />
                    <div
                      className="bg-green-500/50"
                      style={{ width: `${(parseFloat(riskRewardResult.ratio) * 100) / (1 + parseFloat(riskRewardResult.ratio))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-dark-400 mt-1">
                    <span>რისკი</span>
                    <span>მოგება</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* დამატებითი ინფო */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-dark-800/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Percent className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-dark-400 text-sm">რეკომენდებული რისკი</p>
              <p className="text-xl font-bold text-white">1-2%</p>
              <p className="text-xs text-dark-500">თითო ტრეიდზე</p>
            </div>
          </div>
        </div>

        <div className="card bg-dark-800/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-dark-400 text-sm">მინიმალური R:R</p>
              <p className="text-xl font-bold text-white">1:2</p>
              <p className="text-xs text-dark-500">ან უფრო მეტი</p>
            </div>
          </div>
        </div>

        <div className="card bg-dark-800/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-dark-400 text-sm">მაქს. პოზიცია</p>
              <p className="text-xl font-bold text-white">10-20%</p>
              <p className="text-xs text-dark-500">კაპიტალიდან</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
