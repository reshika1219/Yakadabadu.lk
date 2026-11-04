import React from 'react';
import { Link } from 'react-router-dom';
import { LuCog, LuRecycle, LuInbox, LuSparkles, LuTv, LuHammer, LuSofa, LuLamp, LuPackage, LuBike, LuStore, LuWrench, LuBuilding2 } from 'react-icons/lu';
import { MATERIALS, SLOTS, dayLabel, money, statusLabel } from '../lib/format';
import { Pill } from './ui';

const MAT_ICON = { metal: LuCog, plastic: LuRecycle, paper: LuInbox, glass: LuSparkles, ewaste: LuTv, wood: LuHammer };

export const MatIcon = ({ material, size }) => {
  const Icon = MAT_ICON[material] || LuRecycle;
  return <span className="mat-dot" style={{ background: MATERIALS[material]?.color || 'var(--forest)', ...(size && { width: size, height: size }) }}><Icon aria-hidden="true" /></span>;
};

// One pickup as a list row. `to` makes the whole row a link; `meta` adds the customer or driver line.
export const PickupRow = ({ pickup: p, to, meta, side }) => {
  const Tag = to ? Link : 'div';
  return (
    <Tag className="row-item" {...(to && { to })}>
      <MatIcon material={p.pickupType} />
      <div className="row-item__main">
        <div className="row-item__title">
          {MATERIALS[p.pickupType]?.label || p.pickupType}
          <Pill status={p.status} />
        </div>
        <div className="row-item__sub">{p.address}</div>
        <div className="row-item__sub">{dayLabel(p.scheduledTime)} · {SLOTS[p.timeSlot]?.split(' · ')[0] || ''}{meta ? ` · ${meta}` : ''}</div>
      </div>
      <div className="row-item__side">
        {side || (p.status === 'completed'
          ? <><strong>{money(p.amount)}</strong><div className="row-item__sub">{p.weight} kg</div></>
          : p.estimatedAmount ? <><strong>~{money(p.estimatedAmount)}</strong><div className="row-item__sub">estimate</div></> : <span className="row-item__sub">{statusLabel(p.status)}</span>)}
      </div>
    </Tag>
  );
};

const CAT_ICON = { furniture: LuSofa, electronics: LuTv, appliances: LuLamp, 'metal-parts': LuCog, building: LuBuilding2, tools: LuWrench, other: LuBike };
const CAT_COLOR = { furniture: '#a0673a', electronics: '#3b6fb5', appliances: '#14808a', 'metal-parts': '#2f7d4a', building: '#7a5ea8', tools: '#c27a1a', other: '#5f6b62' };

// Photo when the seller uploaded one, otherwise a colour tile with a category icon
export const ListingArt = ({ listing, className = 'listing__img', children }) => {
  const Icon = CAT_ICON[listing.category] || LuPackage;
  return (
    <div className={className} style={listing.image ? undefined : { background: `linear-gradient(135deg, ${CAT_COLOR[listing.category] || '#2f7d4a'}, ${CAT_COLOR[listing.category] || '#2f7d4a'}cc)` }}>
      {listing.image ? <img src={listing.image} alt="" loading="lazy" /> : <Icon aria-hidden="true" />}
      {children}
    </div>
  );
};

export { LuStore };
