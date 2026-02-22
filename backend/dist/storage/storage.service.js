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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class StorageService {
    constructor(storagePath = './data/storage.json') {
        this.storagePath = path.resolve(storagePath);
        this.backupPath = `${this.storagePath}.backup`;
        this.initialize();
    }
    /**
     * Initialize storage file if it doesn't exist
     */
    initialize() {
        try {
            const dir = path.dirname(this.storagePath);
            // Create directory if it doesn't exist
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            // Create storage file with initial structure if it doesn't exist
            if (!fs.existsSync(this.storagePath)) {
                const initialData = { recipes: {} };
                fs.writeFileSync(this.storagePath, JSON.stringify(initialData, null, 2), 'utf-8');
            }
        }
        catch (error) {
            throw new Error(`Failed to initialize storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Read data from storage
     */
    read() {
        try {
            const data = fs.readFileSync(this.storagePath, 'utf-8');
            const parsed = JSON.parse(data);
            // Validate JSON structure
            if (!parsed || typeof parsed !== 'object') {
                throw new Error('Invalid storage format: root must be an object');
            }
            if (!parsed.recipes || typeof parsed.recipes !== 'object') {
                throw new Error('Invalid storage format: recipes must be an object');
            }
            return parsed;
        }
        catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error(`Failed to parse storage file: ${error.message}`);
            }
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
                // File doesn't exist, reinitialize
                this.initialize();
                return this.read();
            }
            throw error;
        }
    }
    /**
     * Write data to storage with atomic operation and backup mechanism
     */
    write(data) {
        try {
            // Validate data structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid data: must be an object');
            }
            if (!data.recipes || typeof data.recipes !== 'object') {
                throw new Error('Invalid data: recipes must be an object');
            }
            // Create backup of current file if it exists
            if (fs.existsSync(this.storagePath)) {
                fs.copyFileSync(this.storagePath, this.backupPath);
            }
            // Write to temporary file first (atomic operation)
            const tempPath = `${this.storagePath}.tmp`;
            const jsonData = JSON.stringify(data, null, 2);
            fs.writeFileSync(tempPath, jsonData, 'utf-8');
            // Rename temp file to actual file (atomic on most systems)
            fs.renameSync(tempPath, this.storagePath);
            // Remove backup after successful write
            if (fs.existsSync(this.backupPath)) {
                fs.unlinkSync(this.backupPath);
            }
        }
        catch (error) {
            // Restore from backup if write failed
            if (fs.existsSync(this.backupPath)) {
                try {
                    fs.copyFileSync(this.backupPath, this.storagePath);
                }
                catch (restoreError) {
                    throw new Error(`Failed to write storage and restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            throw new Error(`Failed to write storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get value by key from recipes
     */
    get(key) {
        const data = this.read();
        return data.recipes[key] || null;
    }
    /**
     * Set value by key in recipes
     */
    set(key, value) {
        const data = this.read();
        data.recipes[key] = value;
        this.write(data);
    }
    /**
     * Delete value by key from recipes
     */
    delete(key) {
        const data = this.read();
        if (key in data.recipes) {
            delete data.recipes[key];
            this.write(data);
            return true;
        }
        return false;
    }
    /**
     * Get all recipes
     */
    getAll() {
        const data = this.read();
        return data.recipes;
    }
    /**
     * Check if key exists
     */
    has(key) {
        const data = this.read();
        return key in data.recipes;
    }
}
exports.StorageService = StorageService;
