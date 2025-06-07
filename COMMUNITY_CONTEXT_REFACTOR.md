# Community Context Refactor - EventContext Pattern

## Overview

Đã refactor toàn bộ Community state management theo pattern của EventContext để đảm bảo **real-time synchronization** giữa các components.

## Key Changes

### 1. **CommunityContext - Core Pattern**

**Before**: Callback-based refresh system
```tsx
// Old pattern
triggerRefresh() → CommunityList.reload()
```

**After**: Shared state with optimistic updates (like EventContext)
```tsx
// New pattern - như EventContext
communities: Community[]
updateCommunityJoinState(communityId, userId, action)
activePendingRequests: string[]
isUserPendingInCommunity(communityId)
```

### 2. **State Management Flow**

**EventContext Pattern Applied**:
1. **Shared State**: `communities[]` được share giữa tất cả components
2. **Optimistic Updates**: Update UI state trước, API call sau
3. **Error Rollback**: Nếu API fail, revert optimistic update
4. **Real-time Sync**: Context state được observe bởi tất cả components

### 3. **Component Updates**

#### **CommunityList.tsx**
- ✅ Sử dụng `const { communities, setCommunities } = useCommunity()`
- ✅ Bỏ local state `useState<Community[]>`
- ✅ Update shared state trong CRUD operations

#### **CommunityCard.tsx**
- ✅ Sử dụng `isUserPendingInCommunity()` thay vì local logic
- ✅ Optimistic updates với `updateCommunityJoinState()`
- ✅ Error rollback mechanism

#### **CommunityHeader.tsx**
- ✅ Context state với fallback: `finalIsMember = isActiveMember || isMember`
- ✅ Real-time button state updates

#### **useCommunityData.ts**
- ✅ Optimistic updates đầu tiên, API call sau
- ✅ Error handling với revert
- ✅ Return `setError` cho backward compatibility

## Pattern Comparison

| Aspect | Old CommunityContext | New CommunityContext (EventContext Pattern) |
|--------|---------------------|---------------------------------------------|
| **State** | Callback refresh | Shared state array |
| **Updates** | Manual refresh | Optimistic updates |
| **Sync** | Event-based | State observation |
| **Error Handling** | Basic toast | Optimistic rollback |
| **Performance** | Full reload | Targeted updates |

## Technical Implementation

### **Core Functions**

```tsx
// Main update function (like updateEventParticipants)
updateCommunityJoinState(communityId: string, userId: string, action: 'join' | 'cancel')

// State tracking (like activeCollaboratorEvents)
activePendingRequests: string[]
activeMemberships: string[]

// Helper functions (like isUserCollaborator)
isUserPendingInCommunity(communityId: string): boolean
isUserMemberOfCommunity(communityId: string): boolean
```

### **Usage Example**

```tsx
// CommunityCard join action
const handleJoin = async () => {
  const userId = user.id;
  
  // 1. Optimistic update FIRST
  updateCommunityJoinState(communityId, userId, 'join');
  
  try {
    // 2. API call
    await communityService.requestToJoin(communityId);
  } catch (error) {
    // 3. Rollback on error
    updateCommunityJoinState(communityId, userId, 'cancel');
  }
};

// All components automatically see the change
const hasPending = isUserPendingInCommunity(communityId); // ✅ Real-time
```

## Benefits

### ✅ **Real-time Sync**
- CommunityCard button updates instantly when CommunityDetail action occurs
- No manual refresh needed

### ✅ **Better UX**
- Optimistic updates = instant feedback
- Loading states managed properly
- Error rollback maintains consistency

### ✅ **Consistent Pattern**
- Same pattern as EventContext
- Easier to maintain and understand
- Reusable logic

### ✅ **Performance**
- No unnecessary full list reloads
- Targeted state updates
- Efficient re-renders

## Testing

### **Test Scenarios**
1. **Cross-component sync**:
   - Open CommunityList and CommunityDetail in different tabs
   - Join from CommunityCard → Check CommunityHeader updates
   - Cancel from CommunityHeader → Check CommunityCard updates

2. **Error handling**:
   - Force API error → Check UI rollback
   - Network disconnect → Check optimistic update behavior

3. **State persistence**:
   - Refresh page → Check state initialization
   - Navigate between pages → Check state consistency

## Files Modified

### Core Context
- ✅ `frontend/src/context/CommunityContext.tsx` - Refactored to EventContext pattern

### Components
- ✅ `frontend/src/components/community/CommunityList.tsx` - Shared state
- ✅ `frontend/src/components/community/CommunityCard.tsx` - Context integration
- ✅ `frontend/src/components/community/CommunityHeader.tsx` - Real-time state

### Hooks
- ✅ `frontend/src/hooks/useCommunityData.ts` - Optimistic updates

### Provider Setup
- ✅ `frontend/src/main.tsx` - CommunityProvider integration

## Build Status
✅ **TypeScript**: No errors
✅ **Build**: Successful
✅ **Pattern**: Consistent with EventContext
✅ **Real-time sync**: Implemented

## Migration Complete

CommunityContext bây giờ hoạt động **exactly like EventContext**:
- Shared state management ✅
- Optimistic updates ✅ 
- Real-time synchronization ✅
- Error handling with rollback ✅
- Consistent API pattern ✅

**Vấn đề đồng bộ nút "Tham Gia" và "Tham Gia Cộng Đồng" đã được giải quyết hoàn toàn!** 🎉 