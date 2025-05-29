# Life Track

Life Track 是一个基于 Tauri、Vue 和 TypeScript 的桌面应用程序，旨在帮助用户管理待办事项和创意想法。该应用程序结合了现代前端技术和 Rust 后端，提供了高效的用户体验和强大的功能。

## 项目特点
- **跨平台支持**：通过 Tauri 实现，支持 Windows、macOS 和 Linux。
- **轻量级**：使用 Rust 作为后端，提供高性能和低资源消耗。
- **现代前端**：采用 Vue 3 和 TypeScript，提供响应式和类型安全的开发体验。

## 功能
- **待办事项管理**：创建、编辑、删除和标记完成待办事项。
- **创意管理**：记录和管理创意想法，支持标记为收藏。
- **数据持久化**：通过 MongoDB Atlas 实现数据的持久化存储。

## 技术栈
- **前端**：Vue 3, TypeScript, Vite
- **后端**：Tauri, Rust, MongoDB

## 环境配置
在运行项目之前，请确保在 `src-tauri` 目录下配置 `.env` 文件，内容如下：

```
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=life_track
```

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Type Support For `.vue` Imports in TS

Since TypeScript cannot handle type information for `.vue` imports, they are shimmed to be a generic Vue component type by default. In most cases this is fine if you don't really care about component prop types outside of templates. However, if you wish to get actual prop types in `.vue` imports (for example to get props validation when using manual `h(...)` calls), you can enable Volar's Take Over mode by following these steps:

1. Run `Extensions: Show Built-in Extensions` from VS Code's command palette, look for `TypeScript and JavaScript Language Features`, then right click and select `Disable (Workspace)`. By default, Take Over mode will enable itself if the default TypeScript extension is disabled.
2. Reload the VS Code window by running `Developer: Reload Window` from the command palette.

You can learn more about Take Over mode [here](https://github.com/johnsoncodehk/volar/discussions/471).

---

# Life Track

Life Track is a desktop application based on Tauri, Vue, and TypeScript, designed to help users manage to-dos and creative ideas. The application combines modern front-end technology with a Rust backend, providing an efficient user experience and powerful features.

## Features
- **Cross-Platform Support**: Implemented through Tauri, supporting Windows, macOS, and Linux.
- **Lightweight**: Uses Rust as the backend for high performance and low resource consumption.
- **Modern Front-End**: Utilizes Vue 3 and TypeScript for a responsive and type-safe development experience.

## Functionality
- **To-Do Management**: Create, edit, delete, and mark to-dos as completed.
- **Idea Management**: Record and manage creative ideas, with support for marking as favorites.
- **Data Persistence**: Achieved through MongoDB Atlas for persistent data storage.

## Tech Stack
- **Front-End**: Vue 3, TypeScript, Vite
- **Back-End**: Tauri, Rust, MongoDB

## Environment Configuration
Before running the project, ensure that the `.env` file is configured in the `src-tauri` directory with the following content:

```
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=life_track
```

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Type Support For `.vue` Imports in TS

Since TypeScript cannot handle type information for `.vue` imports, they are shimmed to be a generic Vue component type by default. In most cases this is fine if you don't really care about component prop types outside of templates. However, if you wish to get actual prop types in `.vue` imports (for example to get props validation when using manual `h(...)` calls), you can enable Volar's Take Over mode by following these steps:

1. Run `Extensions: Show Built-in Extensions` from VS Code's command palette, look for `TypeScript and JavaScript Language Features`, then right click and select `Disable (Workspace)`. By default, Take Over mode will enable itself if the default TypeScript extension is disabled.
2. Reload the VS Code window by running `Developer: Reload Window` from the command palette.

You can learn more about Take Over mode [here](https://github.com/johnsoncodehk/volar/discussions/471).





























