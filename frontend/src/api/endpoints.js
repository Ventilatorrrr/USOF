//endpoints.js

export const endpoints = {
    auth: {
        register: () => "/auth/register",
        login: () => "/auth/login",
        logout: () => "/auth/logout",
        passwordReset: () => "/auth/password-reset",
        passwordResetConfirm: (token) => `/auth/password-reset/${token}`,
        confirmEmail: (token) => `/auth/confirm-email/${token}`,
    },

    users: {
        all: () => "/users",
        me: "/users/me",
        byId: (id) => `/users/${id}`,
        create: () => "/users",
        update: (id) => `/users/${id}`,
        delete: (id) => `/users/${id}`,
        updateAvatar: () => "/users/avatar",
        subscribe: (id) => `/users/${id}/subscribe`,
        unsubscribe: (id) => `/users/${id}/subscribe`,
    },

    posts: {
        all: () => "/posts",
        byId: (id) => `/posts/${id}`,
        create: () => "/posts",
        update: (id) => `/posts/${id}`,
        delete: (id) => `/posts/${id}`,
        comments: (id) => `/posts/${id}/comments`,
        categories: (id) => `/posts/${id}/categories`,
        likes: (id) => `/posts/${id}/like`,
        like: (id) => `/posts/${id}/like`,
        deleteLike: (id) => `/posts/${id}/like`,
        favorite: (id) => `/posts/${id}/favorite`,
        unfavorite: (id) => `/posts/${id}/favorite`,
        report: (id) => `/posts/${id}/report`,
    },

    comments: {
        byId: (id) => `/comments/${id}`,
        likes: (id) => `/comments/${id}/like`,
        like: (id) => `/comments/${id}/like`,
        deleteLike: (id) => `/comments/${id}/like`,
        report: (id) => `/comments/${id}/report`,
        updateStatus: (id) => `/comments/${id}`,
        delete: (id) => `/comments/${id}`,
    },

    categories: {
        all: () => "/categories",
        byId: (id) => `/categories/${id}`,
        posts: (id) => `/categories/${id}/posts`,
        create: () => "/categories", // тільки admin
        update: (id) => `/categories/${id}`, // тільки admin
        delete: (id) => `/categories/${id}`, // тільки admin
    },
};
