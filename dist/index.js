"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_ws_1 = __importDefault(require("express-ws"));
const dotenv_1 = __importDefault(require("dotenv"));
const Y = __importStar(require("yjs"));
const server_1 = require("@hocuspocus/server");
const extension_logger_1 = require("@hocuspocus/extension-logger");
const extension_database_1 = require("@hocuspocus/extension-database");
const supabase_js_1 = require("@supabase/supabase-js");
const transformer_1 = require("@hocuspocus/transformer");
const html_1 = require("@tiptap/html");
const starter_kit_1 = __importDefault(require("@tiptap/starter-kit"));
const extension_character_count_1 = __importDefault(require("@tiptap/extension-character-count"));
const extension_collaboration_1 = __importDefault(require("@tiptap/extension-collaboration"));
const extension_collaboration_cursor_1 = __importDefault(require("@tiptap/extension-collaboration-cursor"));
const extension_highlight_1 = __importDefault(require("@tiptap/extension-highlight"));
const extension_image_1 = __importDefault(require("@tiptap/extension-image"));
const extension_link_1 = __importDefault(require("@tiptap/extension-link"));
const extension_list_keymap_1 = __importDefault(require("@tiptap/extension-list-keymap"));
const extension_placeholder_1 = __importDefault(require("@tiptap/extension-placeholder"));
const extension_table_1 = __importDefault(require("@tiptap/extension-table"));
const extension_table_cell_1 = __importDefault(require("@tiptap/extension-table-cell"));
const extension_table_header_1 = __importDefault(require("@tiptap/extension-table-header"));
const extension_table_row_1 = __importDefault(require("@tiptap/extension-table-row"));
const extension_typography_1 = __importDefault(require("@tiptap/extension-typography"));
dotenv_1.default.config();
const extensions = [
    starter_kit_1.default,
    extension_collaboration_1.default,
    extension_character_count_1.default,
    extension_collaboration_cursor_1.default,
    extension_highlight_1.default,
    extension_image_1.default,
    extension_link_1.default,
    extension_list_keymap_1.default,
    extension_placeholder_1.default,
    extension_table_1.default,
    extension_table_cell_1.default,
    extension_table_header_1.default,
    extension_table_row_1.default,
    extension_typography_1.default,
];
// Supabase client configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
// Configure the server …
const server = new server_1.Hocuspocus({
    port: 1234,
    // Handle connection
    onConnect(data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Client connected:", data.context);
        });
    },
    // Handle disconnection
    onDisconnect(data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Client disconnected:", data.context);
        });
    },
    onChange(data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("onChange!");
        });
    },
    extensions: [
        new extension_logger_1.Logger(),
        new extension_database_1.Database({
            //   // Called when a document is first loaded
            fetch: (props) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const { data, error } = yield supabase
                        .from("documents")
                        .select("content")
                        .match({ id: props.documentName })
                        .single();
                    console.log({ data });
                    if (error)
                        throw error;
                    const json = (0, html_1.generateJSON)(data.content, extensions);
                    console.log("Converted JSON:", json);
                    return Y.encodeStateAsUpdate(transformer_1.TiptapTransformer.toYdoc(json, "default", extensions));
                }
                catch (error) {
                    console.error("Error fetching document:", error);
                    return null;
                }
            }),
            store: (props) => __awaiter(void 0, void 0, void 0, function* () {
                console.log("inside store");
                // Convert Y.doc state to JSON first
                const json = transformer_1.TiptapTransformer.fromYdoc(props.document, "default");
                // Then convert JSON to HTML
                const html = (0, html_1.generateHTML)(json, extensions);
                const { error } = yield supabase
                    .from("documents")
                    .update({ content: html })
                    .match({ id: props.documentName })
                    .single();
            }),
        }),
    ],
});
// Setup your express instance using the express-ws extension
const { app } = (0, express_ws_1.default)((0, express_1.default)());
// A basic http route
app.get("/", (request, response) => {
    response.send("Hello World!");
});
// Add a websocket route for Hocuspocus
// You can set any contextual data like in the onConnect hook
// and pass it to the handleConnection method.
app.ws("/collaboration", (websocket, request) => {
    // example context
    const context = {
        user: {
            id: 1234,
            name: "Jane",
        },
    };
    server.handleConnection(websocket, request, context);
});
// Start the server
app.listen(1234, () => console.log("Listening on http://127.0.0.1:1234"));
