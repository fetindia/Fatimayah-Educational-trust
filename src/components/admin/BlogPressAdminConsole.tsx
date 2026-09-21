/**
 * @license
 * Blog, Press & Media Management Console with Delegated Access Control
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 */

import React, { useState, useEffect } from 'react';
import { 
  Newspaper, 
  Plus, 
  Search, 
  UserCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  Eye, 
  Clock, 
  FileText, 
  Globe, 
  Share2, 
  Tag, 
  User, 
  Calendar,
  X,
  UserPlus,
  ShieldCheck,
  Filter,
  Save,
  Send,
  AlertCircle
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db, cleanFirestoreData, logAuditEvent } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile, UserRole } from '../../types';
import { NewsArticle } from '../home/NewsBlogReaderModal';

interface BlogPressAdminConsoleProps {
  onNotify?: (msg: string) => void;
}

export const BlogPressAdminConsole: React.FC<BlogPressAdminConsoleProps> = ({ onNotify }) => {
  const { currentUser, userProfile, isSuperAdmin, activeRole } = useAuth();
  
  // Articles state
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Delegated Access & Users state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isDelegationModalOpen, setIsDelegationModalOpen] = useState(false);
  const [delegatingUserId, setDelegatingUserId] = useState<string | null>(null);

  // Editor Modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('News & Announcements');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [readTime, setReadTime] = useState('3 min read');
  const [tag, setTag] = useState('Official Bulletin');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Article preview modal
  const [previewArticle, setPreviewArticle] = useState<NewsArticle | null>(null);

  // Check RBAC permissions for publishing
  const hasBlogRole = activeRole === 'blog_admin' || 
                      activeRole === 'content_admin' || 
                      (userProfile?.roles?.some(r => r === 'blog_admin' || r === 'content_admin') ?? false);
  const canPublish = isSuperAdmin || hasBlogRole;

  const showLocalNotice = (msg: string) => {
    setNotification(msg);
    if (onNotify) onNotify(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // 1. Fetch News & Articles from Firestore
  useEffect(() => {
    let isMounted = true;
    try {
      const unsub = onSnapshot(
        collection(db, 'news'),
        (snapshot) => {
          const list: NewsArticle[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            list.push({
              id: d.id,
              title: data.title || 'Untitled Dispatch',
              category: data.category || 'General',
              date: data.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              summary: data.summary || '',
              content: data.content || '',
              author: data.author || 'FET Editorial Bureau',
              readTime: data.readTime || '3 min read',
              imageUrl: data.imageUrl || '',
              tag: data.tag || 'Official'
            });
          });
          if (isMounted) {
            setArticles(list);
            setIsLoadingArticles(false);
          }
        },
        (err) => {
          console.warn('News subscription notice:', err);
          if (isMounted) setIsLoadingArticles(false);
        }
      );
      return () => {
        isMounted = false;
        unsub();
      };
    } catch (e) {
      setIsLoadingArticles(false);
    }
  }, []);

  // 2. Fetch Users for Super Admin Delegation
  useEffect(() => {
    if (!isSuperAdmin) return;
    let isMounted = true;
    try {
      const unsub = onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          const uList: UserProfile[] = [];
          snapshot.forEach((d) => {
            uList.push({ uid: d.id, ...d.data() } as UserProfile);
          });
          if (isMounted) setUsers(uList);
        },
        (err) => {
          console.warn('Users subscription notice for blog delegation:', err);
        }
      );
      return () => {
        isMounted = false;
        unsub();
      };
    } catch (e) {
      console.warn('Could not load users for delegation:', e);
    }
  }, [isSuperAdmin]);

  // Open editor for creating or editing
  const handleOpenEditor = (article?: NewsArticle) => {
    if (!canPublish) {
      showLocalNotice('Permission Denied: You do not have publishing credentials.');
      return;
    }
    setFormError(null);
    if (article) {
      setEditingArticleId(article.id);
      setTitle(article.title || '');
      setCategory(article.category || 'News & Announcements');
      setSummary(article.summary || '');
      setContent(article.content || '');
      setImageUrl(article.imageUrl || '');
      setReadTime(article.readTime || '3 min read');
      setTag(article.tag || 'Official Bulletin');
    } else {
      setEditingArticleId(null);
      setTitle('');
      setCategory('News & Announcements');
      setSummary('');
      setContent('');
      setImageUrl('');
      setReadTime('3 min read');
      setTag('Official Bulletin');
    }
    setIsEditorOpen(true);
  };

  // Save Article (Create or Update)
  const handleSaveArticle = async (status: 'published' | 'draft') => {
    if (!canPublish) {
      setFormError('Access Denied: You are not authorized to publish.');
      return;
    }
    if (!title.trim()) {
      setFormError('Article headline/title is required.');
      return;
    }
    if (!summary.trim()) {
      setFormError('Summary preview is required.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const articleDocId = editingArticleId || `news-${Date.now()}`;
      const nowFormatted = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      const authorName = userProfile?.fullName || userProfile?.displayName || currentUser?.displayName || 'Editorial Bureau';

      const payload = cleanFirestoreData({
        title: title.trim(),
        category: category.trim(),
        summary: summary.trim(),
        content: content.trim() || summary.trim(),
        author: authorName,
        readTime: readTime.trim() || '3 min read',
        imageUrl: imageUrl.trim(),
        tag: tag.trim() || (status === 'draft' ? 'Draft' : 'Official'),
        status: status,
        updatedAt: serverTimestamp(),
        date: editingArticleId ? undefined : nowFormatted
      });

      const newsRef = doc(db, 'news', articleDocId);
      await setDoc(newsRef, payload, { merge: true });

      await logAuditEvent({
        actorUid: currentUser?.uid || 'system',
        actorEmail: currentUser?.email || '',
        actorRole: activeRole || 'blog_admin',
        action: editingArticleId ? 'BLOG_ARTICLE_UPDATED' : 'BLOG_ARTICLE_CREATED',
        targetEntity: 'news',
        targetId: articleDocId,
        details: {
          title: title.trim(),
          status,
          authorName
        }
      });

      showLocalNotice(
        editingArticleId 
          ? `Article updated successfully.` 
          : `New bulletin "${title.trim()}" published to FET India public website.`
      );

      setIsEditorOpen(false);
      setEditingArticleId(null);
    } catch (err: any) {
      console.error('Error saving article:', err);
      setFormError(err?.message || 'Failed to save article. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Article
  const handleDeleteArticle = async (id: string, artTitle: string) => {
    if (!canPublish) {
      showLocalNotice('Permission Denied.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete "${artTitle}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'news', id));
      await logAuditEvent({
        actorUid: currentUser?.uid || 'system',
        actorEmail: currentUser?.email || '',
        actorRole: activeRole || 'blog_admin',
        action: 'BLOG_ARTICLE_DELETED',
        targetEntity: 'news',
        targetId: id,
        details: { articleTitle: artTitle }
      });
      showLocalNotice(`Article deleted.`);
    } catch (err: any) {
      console.error('Error deleting article:', err);
      showLocalNotice(`Failed to delete article: ${err?.message || 'Unknown error'}`);
    }
  };

  // Delegate / Revoke Blog Admin Role (Super Admin Only)
  const handleToggleBlogRole = async (targetUser: UserProfile) => {
    if (!isSuperAdmin) {
      showLocalNotice('Only Super Admin can delegate or revoke publishing permissions.');
      return;
    }

    setDelegatingUserId(targetUser.uid);
    const existingRoles = Array.isArray(targetUser.roles) ? [...targetUser.roles] : [targetUser.primaryRole || 'user'];
    const hasRole = existingRoles.includes('blog_admin');
    
    let updatedRoles: UserRole[];
    if (hasRole) {
      updatedRoles = existingRoles.filter(r => r !== 'blog_admin');
    } else {
      updatedRoles = Array.from(new Set([...existingRoles, 'blog_admin']));
    }

    try {
      const userDocRef = doc(db, 'users', targetUser.uid);
      await updateDoc(userDocRef, {
        roles: updatedRoles,
        updatedAt: serverTimestamp()
      });

      await logAuditEvent({
        actorUid: currentUser?.uid || 'system',
        actorEmail: currentUser?.email || '',
        actorRole: activeRole || 'super_admin',
        action: hasRole ? 'ROLE_REVOKED' : 'ROLE_ASSIGNED',
        targetEntity: 'users',
        targetId: targetUser.uid,
        details: {
          role: 'blog_admin',
          targetName: targetUser.fullName || targetUser.email,
          action: hasRole ? 'revoke' : 'assign'
        }
      });

      showLocalNotice(
        hasRole
          ? `Revoked blog publishing access from ${targetUser.fullName || targetUser.email}`
          : `Delegated blog publishing access to ${targetUser.fullName || targetUser.email}`
      );
    } catch (err: any) {
      console.error('Error modifying blog admin role:', err);
      showLocalNotice(`Failed to update role: ${err?.message || 'Unknown error'}`);
    } finally {
      setDelegatingUserId(null);
    }
  };

  // Filtered Articles
  const filteredArticles = articles.filter(art => {
    if (filterCategory !== 'all' && art.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = art.title.toLowerCase().includes(q);
      const matchSummary = art.summary?.toLowerCase().includes(q);
      const matchCategory = art.category?.toLowerCase().includes(q);
      const matchTag = art.tag?.toLowerCase().includes(q);
      if (!matchTitle && !matchSummary && !matchCategory && !matchTag) return false;
    }
    return true;
  });

  // Delegated user lists
  const delegatedUsers = users.filter(u => u.roles?.includes('blog_admin'));
  const filteredUserSearch = users.filter(u => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.mobileNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6" id="admin-blog-console-full">
      {/* Toast Notification */}
      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Official Blog, Press & Media Management
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorized publication suite for press releases, circulars, announcements, and trust dispatches.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Super Admin Access Delegation Button */}
          {isSuperAdmin && (
            <button
              onClick={() => setIsDelegationModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              id="btn-delegate-blog-access"
              title="Delegate or revoke publishing permissions for registered users"
            >
              <UserPlus className="w-3.5 h-3.5 text-rose-600" />
              <span>Manage Publishing Rights ({delegatedUsers.length})</span>
            </button>
          )}

          {/* Publish New Bulletin Button */}
          {canPublish ? (
            <button
              onClick={() => handleOpenEditor()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              id="btn-publish-bulletin"
            >
              <Plus className="w-4 h-4" />
              <span>Publish New Bulletin</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Read-Only: Contact Super Admin for publishing delegation</span>
            </div>
          )}
        </div>
      </div>

      {/* Role Delegation Banner (Shows active delegate badge if current user is delegated) */}
      {!isSuperAdmin && hasBlogRole && (
        <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="text-xs">
            <span className="font-extrabold text-rose-950">Delegated Blog Publisher Clearance Active: </span>
            <span className="text-rose-800">
              You have been granted official publishing authority by the FET India Super Administrator. You can draft, edit, and publish dispatches directly to the public website.
            </span>
          </div>
        </div>
      )}

      {/* Delegated Publishers Strip (Visible to Super Admin) */}
      {isSuperAdmin && delegatedUsers.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              Currently Delegated Publishing Administrators ({delegatedUsers.length})
            </span>
            <button
              onClick={() => setIsDelegationModalOpen(true)}
              className="text-[11px] font-bold text-rose-700 hover:underline cursor-pointer"
            >
              Modify Delegations
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {delegatedUsers.map((u) => (
              <div 
                key={u.uid}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 shadow-2xs"
              >
                <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-[10px]">
                  {(u.fullName || u.email || 'U')[0].toUpperCase()}
                </div>
                <span className="font-semibold">{u.fullName || u.email}</span>
                <button
                  onClick={() => handleToggleBlogRole(u)}
                  className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                  title="Revoke publishing rights"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Articles Management Table & Filters */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search bulletins & dispatches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-slate-800"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-2.5 py-2 bg-slate-50 text-slate-700 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Scholarship Alert">Scholarship Alerts</option>
              <option value="Examination">Examination</option>
              <option value="Research & Policy">Research & Policy</option>
              <option value="Healthcare & Welfare">Healthcare & Welfare</option>
              <option value="News & Announcements">News & Announcements</option>
              <option value="Official Circular">Official Circulars</option>
            </select>
          </div>
        </div>

        {/* Articles List */}
        {isLoadingArticles ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading trust editorial bulletins...
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
            <Newspaper className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">No articles matching search query</p>
            <p className="text-[11px] text-slate-400 mt-1">Try resetting the filter or search phrase.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
            {filteredArticles.map((art) => (
              <div 
                key={art.id} 
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                      {art.category}
                    </span>
                    {art.tag && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                        {art.tag}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {art.date}
                    </span>
                    {art.author && (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <User className="w-3 h-3" /> {art.author}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {art.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {art.summary}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => setPreviewArticle(art)}
                    className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                    title="Preview Public Article"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Preview</span>
                  </button>

                  {canPublish && (
                    <>
                      <button
                        onClick={() => handleOpenEditor(art)}
                        className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                        title="Edit Article"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden sm:inline text-[11px]">Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteArticle(art.id, art.title)}
                        className="p-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer text-xs font-semibold"
                        title="Delete Article"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* DELEGATION MODAL (SUPER ADMIN ONLY) */}
      {/* ============================================================== */}
      {isDelegationModalOpen && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-rose-600" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Delegate Blog & Media Publishing Access
                  </h3>
                  <p className="text-xs text-slate-500">
                    Grant or revoke press bulletin publishing authority for registered trust users.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDelegationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search registered users */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search registered members by name, email, or mobile..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            {/* Users list with toggle buttons */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
              {filteredUserSearch.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No users found.
                </div>
              ) : (
                filteredUserSearch.map((user) => {
                  const isDelegated = user.roles?.includes('blog_admin');
                  const isTargetProcessing = delegatingUserId === user.uid;

                  return (
                    <div 
                      key={user.uid}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 truncate">
                            {user.fullName || user.email || 'Anonymous User'}
                          </span>
                          {isDelegated && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-100 text-rose-800">
                              Blog Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{user.email}</span>
                          {user.mobileNumber && <span>• {user.mobileNumber}</span>}
                          <span>• Primary Role: {user.primaryRole || 'user'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleBlogRole(user)}
                        disabled={isTargetProcessing}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                          isDelegated
                            ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-200'
                            : 'bg-slate-900 text-white hover:bg-slate-800 shadow-2xs'
                        }`}
                      >
                        {isTargetProcessing 
                          ? 'Updating...' 
                          : isDelegated 
                          ? 'Revoke Access' 
                          : 'Grant Publishing Rights'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsDelegationModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ARTICLE EDITOR MODAL (PUBLISH / EDIT) */}
      {/* ============================================================== */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-5 sm:p-6 space-y-4 my-8 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-rose-600" />
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {editingArticleId ? 'Edit Editorial Bulletin' : 'Publish New Trust Bulletin'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Article Headline / Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Merit Scholarship 2026-27: Final Allocation List Released"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
              </div>

              {/* Grid: Category & Tag & Read Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                  >
                    <option value="News & Announcements">News & Announcements</option>
                    <option value="Scholarship Alert">Scholarship Alert</option>
                    <option value="Examination">Examination</option>
                    <option value="Research & Policy">Research & Policy</option>
                    <option value="Healthcare & Welfare">Healthcare & Welfare</option>
                    <option value="Official Circular">Official Circular</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge / Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Official Dispatch"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimated Read Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 3 min read"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              {/* Cover Image URL */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cover Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {/* Summary / Excerpt */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Brief Summary / Excerpt <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="A concise 1-2 sentence overview shown in article listings and social previews..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {/* Full Article Content */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Dispatch Content / Body
                </label>
                <textarea
                  rows={8}
                  placeholder="Write the complete announcement or dispatch text here. Paragraphs and bullet points are preserved..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveArticle('draft')}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save as Draft</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveArticle('published')}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Publishing...' : 'Publish to Website'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ARTICLE PREVIEW MODAL */}
      {/* ============================================================== */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800">
                {previewArticle.category} • {previewArticle.tag}
              </span>
              <button
                onClick={() => setPreviewArticle(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {previewArticle.imageUrl && (
              <img 
                src={previewArticle.imageUrl} 
                alt={previewArticle.title} 
                className="w-full h-48 object-cover rounded-2xl border border-slate-200"
              />
            )}

            <h3 className="text-lg font-black text-slate-900 leading-snug">
              {previewArticle.title}
            </h3>

            <div className="flex items-center gap-3 text-xs text-slate-500 border-y border-slate-100 py-2">
              <span>Author: <strong>{previewArticle.author}</strong></span>
              <span>•</span>
              <span>Published: {previewArticle.date}</span>
              <span>•</span>
              <span>{previewArticle.readTime}</span>
            </div>

            <p className="text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {previewArticle.summary}
            </p>

            <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
              {previewArticle.content || previewArticle.summary}
            </div>

            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setPreviewArticle(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
