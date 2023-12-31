import Footer from '@/components/Footer';
import {Question, SelectLang, Setting} from '@/components/RightContent';
import {CommentOutlined, LinkOutlined, SettingOutlined} from '@ant-design/icons';
import type {Settings as LayoutSettings} from '@ant-design/pro-components';
import {SettingDrawer} from '@ant-design/pro-components';
import type {RunTimeLayoutConfig} from '@umijs/max';
import {history, Link, RequestConfig} from '@umijs/max';
import defaultSettings from '../config/defaultSettings';
import {errorConfig} from './requestErrorConfig';
import {currentUser as queryCurrentUser} from './services/ant-design-pro/api';
import React, {useState} from 'react';
import {AvatarDropdown, AvatarName} from './components/RightContent/AvatarDropdown';
import {adminMenus} from "@/services/admin/AdminService";
import {FloatButton} from 'antd';

const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/user/login';


/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<{
    settings?: Partial<LayoutSettings>;
    currentUser?: API.CurrentUser;
    loading?: boolean;
    fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
    menu?: boolean;
}> {
    const fetchUserInfo = async () => {
        try {
            const msg = await queryCurrentUser({
                skipErrorHandler: true,
            });
            return msg.data;
        } catch (error) {
            history.push(loginPath);
        }
        return undefined;
    };
    // 如果不是登录页面，执行
    const {location} = history;
    if (location.pathname !== loginPath) {
        const currentUser = await fetchUserInfo();
        return {
            fetchUserInfo,
            currentUser,
            settings: defaultSettings as Partial<LayoutSettings>,
            // TODO 开发时使用，生产环境默认false
            menu: false,
        };
    }
    return {
        fetchUserInfo,
        settings: defaultSettings as Partial<LayoutSettings>,
    };
}


// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({initialState, setInitialState}) => {

    const [open, setOpen] = useState<boolean>(true);

    const onChange = (checked: boolean) => {
        setOpen(checked);
    };

    return {
        actionsRender: () => [<Question key="doc"/>, <SelectLang key="SelectLang"/>, <Setting key="setting"/>],
        avatarProps: {
            src: initialState?.currentUser?.avatar,
            title: <AvatarName/>,
            render: (_, avatarChildren) => {
                return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
            },
        },
        waterMarkProps: {
            content: initialState?.currentUser?.name,
        },
        menu: {
            params: {
                userId: initialState?.currentUser?.userid,
            },
            request: async () => {
                // initialState.currentUser 中包含了所有用户信息
                const menuData = await adminMenus();
                return menuData.data;
            },
        },
        footerRender: () => <Footer/>,
        onPageChange: () => {
            const {location} = history;
            // 如果没有登录，重定向到 login
            if (!initialState?.currentUser && location.pathname !== loginPath) {
                history.push(loginPath);
            }
        },
        openKeys: false,
        onOpenChange: (openKeys) => {
            console.log("onOpenChange", openKeys)
        },
        locale: false,
        layoutBgImgList: [
            {
                src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
                left: 85,
                bottom: 100,
                height: '303px',
            },
            {
                src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
                bottom: -68,
                right: -45,
                height: '303px',
            },
            {
                src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
                bottom: 0,
                left: 0,
                width: '331px',
            },
        ],
        links: isDev
            ? [
                <Link key="openapi" to="/umi/plugin/openapi" target="_blank">
                    <LinkOutlined/>
                    <span>OpenAPI 文档</span>
                </Link>,
            ]
            : [],
        menuHeaderRender: false,
        // 自定义 403 页面
        // unAccessible: <div>unAccessible</div>,
        // 增加一个 loading 的状态
        childrenRender: (children) => {
            // if (initialState?.loading) return <PageLoading />;
            return (
                <>
                    {children}
                    <FloatButton.Group
                        trigger="hover"
                        type="primary"
                        style={{right: 24}}
                        icon={<SettingOutlined/>}
                    >
                        <FloatButton/>
                        <FloatButton icon={<CommentOutlined/>}/>
                    </FloatButton.Group>
                    {/*<Switch onChange={onChange} checked={open} style={{margin: 16}}/>*/}
                    <SettingDrawer
                        disableUrlParams
                        enableDarkTheme
                        settings={initialState?.settings}
                        onSettingChange={(settings) => {
                            setInitialState((preInitialState) => ({
                                ...preInitialState,
                                settings,
                            }));
                        }}
                    />

                </>
            );
        },
        ...initialState?.settings,
    };
};


const pageArgumentsInterceptor = (url: string, options: RequestConfig) => {
    const obj: any = options;
    console.log(JSON.stringify(obj));
    const {params} = obj;
    if (params) {
        if (params.current) {
            params.page = params.current;
            delete params.current;
        }
        if (params.pageSize) {
            params.size = params.pageSize;
            delete params.pageSize;
        }
    }

    return {
        url: url,
        options: obj,
    };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request = {
    ...errorConfig,
    credentials: 'include',
    // 新增自动添加AccessToken的请求前拦截器
    requestInterceptors: [pageArgumentsInterceptor],
};
