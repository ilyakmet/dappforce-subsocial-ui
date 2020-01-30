
import { BareProps } from '@polkadot/ui-app/types';

import BN from 'bn.js';
import React, { useState, FunctionComponent } from 'react';
import { AccountId, AccountIndex, Address, Balance, Option } from '@polkadot/types';
import { withCall, withMulti, withCalls } from '@polkadot/ui-api';
import InputAddress from './InputAddress';
import classes from '@polkadot/ui-app/util/classes';
import toShortAddress from '@polkadot/ui-app/util/toShortAddress';
import BalanceDisplay from '@polkadot/ui-app/Balance';
import IdentityIcon from '@polkadot/ui-app/IdentityIcon';
import { findNameByAddress, nonEmptyStr, queryBlogsToProp, ZERO } from './index';
const FollowAccountButton = dynamic(() => import('./FollowAccountButton'), { ssr: false });
import { MyAccountProps, withMyAccount } from './MyAccount';
import { withSocialAccount } from './utils';
import { SocialAccount, Profile, ProfileContent } from '../types';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { AccountFollowersModal, AccountFollowingModal } from '../profiles/AccountsListModal';
import Router from 'next/router';
import { MutedDiv } from './MutedText';
import { Pluralize } from './Plularize';
import { DfBgImg } from './DfBgImg';
import { Popover, Icon } from 'antd';
import dynamic from 'next/dynamic';
import { isBrowser } from 'react-device-detect';

const LIMIT_SUMMARY = 40;

type Variant = 'username' | 'mini-preview' | 'profile-preview' | 'preview' | 'address-popup';

export type Props = MyAccountProps & BareProps & {
  socialAccountOpt?: Option<SocialAccount>,
  profile?: Profile,
  ProfileContent?: ProfileContent,
  socialAccount?: SocialAccount,
  balance?: Balance | Array<Balance> | BN,
  children?: React.ReactNode,
  isPadded?: boolean,
  extraDetails?: React.ReactNode,
  isShort?: boolean,
  session_validators?: Array<AccountId>,
  value?: AccountId | AccountIndex | Address | string,
  name?: string,
  size?: number,
  withAddress?: boolean,
  withBalance?: boolean,
  withName?: boolean,
  withProfilePreview?: boolean,
  withFollowButton?: boolean,
  variant: Variant,
  optionalProfile: boolean,
  date: string,
  event?: string,
  count?: number,
  subject?: React.ReactNode,
  asActivity?: boolean
};

function AddressComponents (props: Props) {

  const { children,
    myAddress,
    className,
    isPadded = true,
    extraDetails,
    style,
    size,
    value,
    socialAccount,
    profile = {} as Profile,
    ProfileContent = {} as ProfileContent,
    withFollowButton,
    withBalance = true,
    asActivity = false,
    withName = false,
    variant = 'preview',
    date,
    event,
    count,
    subject } = props;
  if (!value) {
    return null;
  }

  const address = value.toString();

  const {
    username
  } = profile;

  const {
    fullname,
    avatar,
    about
  } = ProfileContent;

  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);

  const openFollowersModal = () => {
    if (!followers) return;

    setFollowersOpen(true);
  };

  const openFollowingModal = () => {
    if (!following) return;

    setFollowingOpen(true);
  };

  const followers = socialAccount !== undefined ? socialAccount.followers_count.toNumber() : 0;
  const following = socialAccount !== undefined ? socialAccount.following_accounts_count.toNumber() : 0;
  const reputation = socialAccount ? new BN(socialAccount.reputation) : ZERO;

  const summary = about !== undefined && about.length > LIMIT_SUMMARY ? about.substr(0, LIMIT_SUMMARY) + '...' : about;

  const isMyProfile: boolean = address === myAddress;

  const RenderFollowButton = () => (!isMyProfile)
    ? <div className='AddressComponents follow'><FollowAccountButton address={address} /></div>
    : null;

  const AutorPreview = () => {
    return <div
      className={classes('ui--AddressComponents', isPadded ? 'padded' : '', className)}
      style={style}
    >
      <div className='ui--AddressComponents-info'>
        <RenderAvatar size={size || 36} address={address} avatar={avatar} />
        <div className='DfAddressMini-popup'>
          <Popover
            placement='topLeft'
            content={<ProfilePreview />}
          >
            <div
              className={`ui--AddressComponents-address ${'asLink'} ${className} ${asActivity && 'activity'}`}
              onClick={() => Router.push(`/profile/${address}`)}
            >
              {fullname || username || toShortAddress(address)}
            </div>
          </Popover>
          {followersOpen && <AccountFollowersModal id={address} followersCount={followers} open={followersOpen} close={() => setFollowersOpen(false)} title={<Pluralize count={followers} singularText='Follower' />} />}
          {followingOpen && <AccountFollowingModal id={address} followingCount={following} open={followingOpen} close={() => setFollowingOpen(false)} title={<Pluralize count={following} singularText='Following' />} />}
          {withName && <RenderName address={address} name={name} />}
          {asActivity
            ? <RenderPreviewForActivity />
            : <RenderPreviewForAddress />
          }
        </div>
        {withFollowButton && <RenderFollowButton />}
        {children}
      </div>
    </div>;
  };

  function RenderPreviewForAddress () {
    return <>
      <div className='Df--AddressComponents-details'>
        {withBalance && <RenderBalance address={address} />}
        {' · '}
        {extraDetails}
      </div>
    </>;
  }

  function AddressPopup () {
    return <Popover
      placement='bottomRight'
      trigger='click'
      className='TopMenuAccount'
      overlayClassName='TopMenuAccountPopover'
      content={<RenderAddressPreview />}
    >
      <div className='addressIcon'>
        <RenderAvatar size={36} address={address} avatar={avatar} />
      </div>
      <div className='addressInfo'>
        <RenderAddress asLink={false} />
        <RenderBalance address={address} />
      </div>
      <Icon type='caret-down' />
    </Popover>;
  }

  function RenderPreviewForActivity () {
    const renderCount = () => count && count > 0 && <>{' and'} <Pluralize count={count} singularText='other person' pluralText='other people' /></>;

    return <>
      <span className='DfActivityStreamItem content'>
        <span className='DfActivity--count'>{renderCount()}</span>
        <span className='DfActivity--event'>{' ' + event + ' '}</span>
        <span className='handle DfActivity--subject'>{subject}</span>
      </span>
      <MutedDiv className='DfDate'>{date}</MutedDiv>
    </>;
  }

  type ProfilePreviewProps = {
    mini?: boolean
  };

  const ProfilePreview: FunctionComponent<ProfilePreviewProps> = ({ mini = false }) => { // TODO fix CSS style
    return <div>
      <div className={`item ProfileDetails MyProfile`}>
        <RenderAvatar size={40} address={address} avatar={avatar} style={{ marginTop: '.5rem' }}/>
        <div className='content' style={{ paddingLeft: '1rem' }}>
          <div className='header DfAccountTitle'>
            <RenderAddressForProfile />
          </div>
          {!mini && <>
            <div className='DfPopup-about'>
              <ReactMarkdown source={summary} linkTarget='_blank' />
            </div>
            <div className='DfPopup-links'>
            <div onClick={openFollowersModal} className={`DfPopup-link ${followers ? '' : 'disable'}`}>
              <Pluralize count={followers} singularText='Follower'/>
            </div>
            <div onClick={openFollowingModal} className={`DfPopup-link ${following ? '' : 'disable'}`}>
              <Pluralize count={following} singularText='Following'/>
            </div>
          </div>
          </>}
        </div>
        <RenderFollowButton />
      </div>
    </div>;
  };

  function RenderAddressPreview () {
    return <div className='addressPreview'>
      <div className='profileInfo'>
        <div className='profileDesc'>
          My reputations: {reputation.toString()}
        </div>
      </div>
      <InputAddress
        className='DfTopBar--InputAddress' // FIXME dropdown in  popup
        type='account'
        withLabel={false}
      />
    </div>;
  }

  const RenderAddressForProfile = () => {
    return (
      <Link href='/profile/[address]' as={`/profile/${address}`}>
        <a className='ui--AddressComponents-address'>
          <b className='AddressComponents-fullname'>{fullname || toShortAddress(address)}</b>
          <div className='DfPopup-username'>{username}</div>
        </a>
      </Link>
    );
  };

  type AddressProps = {
    isShort?: boolean,
    asLink?: boolean
  };

  const RenderAddress: FunctionComponent<AddressProps> = ({ asLink = true, isShort = true }) => {
    return (
      <div
        className={`ui--AddressComponents-address ${asLink && 'asLink'} ${className} ${asActivity && 'activity'}`}
        onClick={() => asLink && Router.push(`/profile/${address}`)}
      >
        {fullname || username || (isShort ? toShortAddress(address) : address)}
      </div>
    );
  };

  switch (variant) {
    case 'username': {
      return <RenderAddress />;
    }
    case 'profile-preview': {
      return <ProfilePreview />;
    }
    case 'mini-preview': {
      return <ProfilePreview mini/>;
    }
    case 'address-popup': {
      return <AddressPopup />;
    }
    case 'preview': {
      return <AutorPreview />;
    }
  }
}

type ImageProps = {
  size: number,
  style?: any,
  address: string,
  avatar: string
};

const RenderAvatar: FunctionComponent<ImageProps> = ({ size, avatar, address, style }) => {
  return avatar && nonEmptyStr(avatar)
    ? <DfBgImg size={size} src={avatar} className='DfAvatar' style={style} rounded />
    : <IdentityIcon
      style={style}
      size={size}
      value={address}
    />;
};

type NameProps = {
  address: string,
  name: string
};

const RenderName: FunctionComponent<NameProps> = ({ address, name }) => {
  const nameAccount = name ? name : findNameByAddress(address);
  return (nonEmptyStr(nameAccount) ?
    <div className={'ui--AddressSummary-name'} >
      Name: <b style={{ textTransform: 'uppercase' }}>{nameAccount}</b>
    </div> : null
  );
};

type BalanceProps = {
  address: string
};

const RenderBalance: FunctionComponent<BalanceProps> = ({ address }) => {
  return (
    <BalanceDisplay
      label={isBrowser ? 'Balance: ' : ''}
      className='ui--AddressSummary-balance'
      params={address}
    />
  );
};

export default withMulti(
  AddressComponents,
  withMyAccount,
  withCall('query.session.validators'),
  withCalls<Props>(
    queryBlogsToProp('socialAccountById',
      { paramName: 'value', propName: 'socialAccountOpt' })
  ),
  withSocialAccount
);