import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from 'bun:test';
import * as utils from './utils'; // Import * as utils to spy on its methods
import {
    createHNItemUrl,
    handleError,
    validateAndFetchHNItem,
    createNotificationResponse,
    determineFormatNotification,
    updateCommentCount, // Import to allow spying if needed, though mocking KV is better
    getItem,
    HN_PREFIX,
    HN_BASE_URL
} from './utils';
import type { HNItem, FollowedItem, Env } from './types';
import type { Context } from 'hono';

// Mock @better-fetch/fetch
// This will be hoisted by Bun's test runner
mock.module('@better-fetch/fetch', () => ({
    betterFetch: mock(() => Promise.resolve({ data: null, error: null })),
}));
// Now we can import the mocked version
import { betterFetch } from '@better-fetch/fetch';


// Mock for KV Namespace
const mockKVStore = {
    put: mock((key: string, value: string) => Promise.resolve()),
    get: mock((key: string) => Promise.resolve(null)), // Default to item not found
};

// Mock for Hono Context
const mockCtx = {
    env: {
        following: mockKVStore, // Correctly path to the KV namespace based on Env['Bindings']
    },
    json: mock((data: any, status?: number) => ({ data, status: status || 200 })), // Mock Hono's json response
} as unknown as Context<Env>;


describe('Utility Functions from utils.ts', () => {
    beforeEach(() => {
        // Reset mocks before each test
        (betterFetch as any).mockClear();
        mockKVStore.put.mockClear();
        mockKVStore.get.mockClear();
        mockCtx.json.mockClear();
    });

    describe('createHNItemUrl', () => {
        it('should create a valid HN item URL using news.ycombinator.com', () => {
            const id = 12345;
            const expectedUrl = `${HN_BASE_URL}?id=${id}`; // Uses HN_BASE_URL from utils.ts
            expect(createHNItemUrl(id)).toBe(expectedUrl);
        });
    });

    describe('handleError', () => {
        let consoleErrorSpy: any;

        beforeEach(() => {
            // Spy on console.error before each test in this block
            consoleErrorSpy = spyOn(console, 'error');
        });

        afterEach(() => {
            // Restore the original console.error after each test
            consoleErrorSpy.mockRestore();
        });

        it('should return an object with error message from Error instance and log the error', () => {
            const error = new Error('Test error message');
            const result = handleError(error);
            expect(result).toEqual({ message: 'Test error message' });
            expect(consoleErrorSpy).toHaveBeenCalledWith("Original error:", error);
        });

        it('should return an object with the string itself if error is a string and log the error', () => {
            const errorMessage = 'A string error occurred';
            const result = handleError(errorMessage);
            expect(result).toEqual({ message: errorMessage });
            expect(consoleErrorSpy).toHaveBeenCalledWith("Original error:", errorMessage);
        });

        it('should return an object with message from error.message if error is an object with a string message property and log the error', () => {
            const errorObject = { message: 'Object error message' };
            const result = handleError(errorObject);
            expect(result).toEqual({ message: 'Object error message' });
            expect(consoleErrorSpy).toHaveBeenCalledWith("Original error:", errorObject);
        });

        it('should return "An unexpected error occurred." if error is an object with a non-string message property and log the error', () => {
            const errorObject = { message: 12345 }; // Non-string message
            const result = handleError(errorObject);
            expect(result).toEqual({ message: "An unexpected error occurred." });
            expect(consoleErrorSpy).toHaveBeenCalledWith("Original error:", errorObject);
        });

        it('should return "An unexpected error occurred." for other object type errors and log the error', () => {
            const errorObject = { code: 'E123', detail: 'Some detail' };
            const result = handleError(errorObject);
            expect(result).toEqual({ message: "An unexpected error occurred." });
            expect(consoleErrorSpy).toHaveBeenCalledWith("Original error:", errorObject);
        });

        it('should return "An unexpected error occurred." for null and log the error', () => {
            const result = handleError(null);
            expect(result).toEqual({ message: "An unexpected error occurred." });
            expect(consoleErrorSpy).toHaveBeenCalledWith("Original error:", null);
        });

        it('should return "An unexpected error occurred." for undefined and log the error', () => {
            const result = handleError(undefined);
            expect(result).toEqual({ message: "An unexpected error occurred." });
            expect(consoleErrorSpy).toHaveBeenCalledWith("Original error:", undefined);
        });
    });

    describe('validateAndFetchHNItem', () => {
        it('should fetch and return valid HN item data', async () => {
            const mockItemId = 123;
            const mockItemData: HNItem = { id: mockItemId, type: 'story', title: 'Test Story', kids: [1,2,3], time: Date.now()/1000 };
            (betterFetch as any).mockResolvedValueOnce({ data: mockItemData, error: null });

            const item = await validateAndFetchHNItem(mockItemId);
            expect(item).toEqual(mockItemData);
            expect(betterFetch).toHaveBeenCalledWith(`https://hacker-news.firebaseio.com/v0/item/${mockItemId}.json`);
        });

        it('should throw an error if fetch returns an error', async () => {
            const mockItemId = 456;
            (betterFetch as any).mockResolvedValueOnce({ data: null, error: new Error('Network failure') });

            await expect(validateAndFetchHNItem(mockItemId))
                .rejects.toThrow(`Error getting HN item ${mockItemId}`);
            expect(betterFetch).toHaveBeenCalledWith(`https://hacker-news.firebaseio.com/v0/item/${mockItemId}.json`);
        });

        it('should throw an error if fetched data is null and error is null (invalid item)', async () => {
            const mockItemId = 789;
            (betterFetch as any).mockResolvedValueOnce({ data: null, error: null });
            await expect(validateAndFetchHNItem(mockItemId))
                .rejects.toThrow(`HN item ${mockItemId} is not a valid item`);
            expect(betterFetch).toHaveBeenCalledWith(`https://hacker-news.firebaseio.com/v0/item/${mockItemId}.json`);
        });
        // Removed tests for 'dead' or 'deleted' as validateAndFetchHNItem doesn't check for them
    });

    describe('updateCommentCount', () => {
        it('should call KV store put with correct key and value', async () => {
            const testKey = `${HN_PREFIX}123`;
            const currentComments = 42;
            await updateCommentCount(mockCtx, testKey, currentComments);
            expect(mockKVStore.put).toHaveBeenCalledWith(testKey, "42");
        });
    });

    describe('createNotificationResponse', () => {
        it('should create a notification for a story with new comments', () => {
            const id = 1;
            const storedComments = 10;
            const currentComments = 15;
            const title = 'A Great Story';
            const response = createNotificationResponse(id, storedComments, currentComments, 'story', title);

            expect(response.id).toBe(1);
            expect(response.newComments).toBe(5); // 15 - 10
            expect(response.url).toBe(createHNItemUrl(id));
            expect(response.notification).toBe(true);
            expect(response.type).toBe('story');
            expect(response.title).toBe(title);
        });

        it('should create a notification for a comment with no new comments', () => {
            const id = 2;
            const storedComments = 5;
            const currentComments = 5; // No new comments
            const response = createNotificationResponse(id, storedComments, currentComments, 'comment');

            expect(response.id).toBe(2);
            expect(response.newComments).toBe(0);
            expect(response.notification).toBe(false);
            expect(response.type).toBe('comment');
            expect(response.title).toBeUndefined();
        });

        it('should not include title if type is comment, even if title is passed', () => {
            const id = 3;
            const response = createNotificationResponse(id, 0, 1, 'comment', 'Unexpected Title');
            expect(response.type).toBe('comment');
            expect(response.title).toBeUndefined();
        });
    });

    describe('determineFormatNotification', () => {
        it('should process a story with new comments and trigger KV update', async () => {
            const itemId = 101;
            const hnItem: HNItem = { id: itemId, type: 'story', title: 'New Story', kids: [1,2,3,4,5,6,7,8,9,10], time: Date.now()/1000 }; // 10 kids
            const followedItem: FollowedItem = { key: `${HN_PREFIX}${itemId}`, id: itemId, comments: 5, url: createHNItemUrl(itemId) };

            const notification = await determineFormatNotification(mockCtx, hnItem, followedItem);

            expect(notification).toBeDefined();
            expect(notification.newComments).toBe(5); // 10 (kids.length) - 5 (stored)
            expect(notification.notification).toBe(true);
            expect(notification.title).toBe('New Story');
            expect(mockKVStore.put).toHaveBeenCalledWith(`${HN_PREFIX}${itemId}`, "10");
        });

        it('should process a comment with no new comments, should not trigger KV update', async () => {
            const itemId = 102;
            const hnItem: HNItem = { id: itemId, type: 'comment', parent: 100, kids: [1,2,3], time: Date.now()/1000 }; // 3 kids
            const followedItem: FollowedItem = { key: `${HN_PREFIX}${itemId}`, id: itemId, comments: 3, url: createHNItemUrl(itemId) };

            const notification = await determineFormatNotification(mockCtx, hnItem, followedItem);

            expect(notification).toBeDefined();
            expect(notification.newComments).toBe(0);
            expect(notification.notification).toBe(false);
            expect(notification.title).toBeUndefined();
            expect(mockKVStore.put).not.toHaveBeenCalled(); // Comments didn't increase
        });

        it('should handle item with no kids (0 comments)', async () => {
            const itemId = 103;
            const hnItem: HNItem = { id: itemId, type: 'story', title: 'No Comments Yet', kids: [], time: Date.now()/1000 }; // 0 kids
            const followedItem: FollowedItem = { key: `${HN_PREFIX}${itemId}`, id: itemId, comments: 0, url: createHNItemUrl(itemId) };

            const notification = await determineFormatNotification(mockCtx, hnItem, followedItem);
            expect(notification.newComments).toBe(0);
            expect(notification.notification).toBe(false);
            expect(mockKVStore.put).not.toHaveBeenCalled();
        });

        it('should handle item where descendants is present but kids is null/undefined (0 comments)', async () => {
            const itemId = 104;
            // HN API might return 'descendants' for stories/polls but 'kids' might be absent if there are no direct comments
            const hnItem: HNItem = { id: itemId, type: 'story', title: 'No Kids Key', descendants: 10, time: Date.now()/1000 }; // kids is undefined
            const followedItem: FollowedItem = { key: `${HN_PREFIX}${itemId}`, id: itemId, comments: 0, url: createHNItemUrl(itemId) };

            const notification = await determineFormatNotification(mockCtx, hnItem, followedItem);
            expect(notification.newComments).toBe(0); // kids?.length ?? 0 results in 0
            expect(notification.notification).toBe(false);
            expect(mockKVStore.put).not.toHaveBeenCalled();
        });


        it('should throw error for invalid item type (e.g. poll)', async () => {
            const itemId = 105;
            const hnItem = { id: itemId, type: 'poll', kids: [1,2], time: Date.now()/1000 } as HNItem; // type 'poll' is not handled
            const followedItem: FollowedItem = { key: `${HN_PREFIX}${itemId}`, id: itemId, comments: 1, url: createHNItemUrl(itemId) };

            await expect(determineFormatNotification(mockCtx, hnItem, followedItem))
                .rejects.toThrow("Can't format this type of item");
            expect(mockKVStore.put).not.toHaveBeenCalled();
        });

        it('should throw error if item type is missing', async () => {
            const itemId = 106;
            const hnItem = { id: itemId, title: "Missing type", kids: [1,2], time: Date.now()/1000 } as HNItem; // type is undefined
            const followedItem: FollowedItem = { key: `${HN_PREFIX}${itemId}`, id: itemId, comments: 1, url: createHNItemUrl(itemId) };

            await expect(determineFormatNotification(mockCtx, hnItem, followedItem))
                .rejects.toThrow("Can't format this type of item");
             expect(mockKVStore.put).not.toHaveBeenCalled();
        });
    });

    describe('getItem', () => {
        it('should retrieve and format an item from KV store', async () => {
            const itemId = 201;
            const itemKey = `${HN_PREFIX}${itemId}`;
            const storedValue = "15"; // Comments stored as string
            mockKVStore.get.mockResolvedValueOnce(storedValue);

            const item = await getItem(mockCtx, itemKey);

            expect(mockKVStore.get).toHaveBeenCalledWith(itemKey);
            expect(item).toEqual({
                key: itemKey,
                id: itemId,
                comments: 15,
                url: createHNItemUrl(itemId),
            });
        });

        it('should return null if item not found in KV store', async () => {
            const itemKey = `${HN_PREFIX}999`;
            mockKVStore.get.mockResolvedValueOnce(null); // Item not found

            const item = await getItem(mockCtx, itemKey);
            expect(item).toBeNull();
        });
    });
});

console.log("src/utils.test.ts updated according to src/utils.ts and src/types.ts structure.");
