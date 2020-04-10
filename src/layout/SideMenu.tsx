import React, { useState, useEffect } from 'react';

import { Menu, Icon } from 'antd';
import Router, { useRouter } from 'next/router';
import { useMyAccount, checkIfLoggedIn } from '../components/utils/MyAccountContext';
import { isMobile } from 'react-device-detect';
import { useSidebarCollapsed } from '../components/utils/SideBarCollapsedContext';
import { Loading, getEnv } from '../components/utils/utils';
import { RenderFollowedList } from '../components/blogs/ListFollowingBlogs';
import { useSubsocialApi } from '../components/utils/SubsocialApiContext'
import Link from 'next/link';
import { BlogData } from '@subsocial/types/dto';
import { newLogger } from '@subsocial/utils';

const log = newLogger('SideMenu')

const appsUrl = getEnv('APPS_URL') || 'http://127.0.0.1:3002';

interface MenuItem {
  name: string;
  page: string[];
  image: string;
}

const InnerMenu = () => {
  const { toggle, state: { collapsed, trigerFollowed } } = useSidebarCollapsed();
  const { state: { address: myAddress } } = useMyAccount();
  const { state: { subsocial, substrate } } = useSubsocialApi();
  const isLoggedIn = checkIfLoggedIn();
  const [ followedBlogsData, setFollowedBlogsData ] = useState([] as BlogData[]);
  const [ loaded, setLoaded ] = useState(false);
  const router = useRouter();
  const { pathname } = router;

  useEffect(() => {
    if (!myAddress) return;

    let isSubscribe = true;

    const loadBlogsData = async () => {
      setLoaded(false);
      const ids = await substrate.blogsFollowedByAccount(myAddress)
      const blogsData = await subsocial.findBlogs(ids);
      isSubscribe && setFollowedBlogsData(blogsData);
      isSubscribe && setLoaded(true);
    };

    loadBlogsData().catch(err => log.error('Error load blogs data:', err));

    return () => { isSubscribe = false; };
  }, [ trigerFollowed, myAddress ]);

  const onClick = (page: string[]) => {
    isMobile && toggle();
    Router.push(page[0], page[1]).catch(err => log.error('Error while route:', err));
  };

  const DefaultMenu: MenuItem[] = [
    {
      name: 'All blogs',
      page: [ '/blogs/all' ],
      image: 'global'
    }
  ];

  const AuthorizedMenu: MenuItem[] = [
    {
      name: 'Feed',
      page: [ '/feed' ],
      image: 'profile'
    },
    ...DefaultMenu,
    {
      name: 'New blog',
      page: [ '/blogs/new' ],
      image: 'plus'
    },
    {
      name: 'My blogs',
      page: [ '/blogs/my/[address]', `/blogs/my/${myAddress}` ],
      image: 'book'
    },
    {
      name: 'Following blogs',
      page: [ '/blogs/following/[address]', `/blogs/following/${myAddress}` ],
      image: 'book'
    },
    {
      name: 'Notifications',
      page: [ '/notifications' ],
      image: 'notification'
    },
    {
      name: 'My profile',
      page: [ '/profile/[address]', `/profile/${myAddress}` ],
      image: 'idcard'
    }
  ];

  const MenuItems = isLoggedIn ? AuthorizedMenu : DefaultMenu;

  return (
    <Menu
      selectedKeys={[ pathname ]}
      mode='inline'
      theme='light'
      style={{ height: '100%', borderRight: 0 }}
    >
      {MenuItems.map(item =>
        <Menu.Item key={item.page[0]} onClick={() => onClick(item.page)}>
          <Link href={item.page[0]} as={item.page[1]}>
            <a>
              <Icon type={item.image} />
              <span>{item.name}</span>
            </a>
          </Link>
        </Menu.Item>)}
      <Menu.Divider/>
      <Menu.Item key={'advanced'} >
        <a href={appsUrl}>
          <Icon type='exception' />
          <span>Advanced</span>
        </a>
      </Menu.Item>
      <Menu.Divider/>
      {isLoggedIn && <Menu.ItemGroup className={`DfSideMenu--FollowedBlogs ${collapsed && 'collapsed'}`} key='followed' title='Followed blogs'>
        {loaded ? <RenderFollowedList followedBlogsData={followedBlogsData} /> : <Loading/>}
      </Menu.ItemGroup>}
    </Menu>
  );
};

export default InnerMenu;
