/**
 * @license
 * Dedicated Delegated Publishing & Media Control Center
 * Fatimyah Educational Trust India (FET India)
 * 
 * Provides an isolated, role-guarded publishing workspace for delegated users:
 * - News Publisher / Editor
 * - Trust Content Publisher / Editor
 * - Bulletin Publisher / Editor
 * 
 * Strictly isolates unauthorized modules (Finance, HRMS, Exams, Crowdfunding,
 * Membership, Users, RBAC, etc.) and enforces granular publication permissions.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Newspaper, 
  FileText, 
  Building2, 
  ShieldCheck, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  Send, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  X, 
  Upload, 
  Link as LinkIcon, 
  Info,
  Award,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db, cleanFirestoreData, logAuditEvent } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { NewsArticle } from '../home/NewsBlogReaderModal';
import { UserRole } from '../../types';
import { uploadCmsMedia } from '../../lib/storage';

interface PublishingDashboardProps {
  onNotify?: (message: string, type?: 'success' | 'info' | 'error') => void;
  onReturnToPublic?: () => void;
  onOpenUserDashboard?: () => void;
}

export type PublishingTab = 'news' | 'trust_content' | 'bulletins' | 'media';

export const PublishingDashboard: React.FC<PublishingDashboardProps> = ({
  onNotify,
  onReturnToPublic,
  onOpenUserDashboard
}) => {
  const { 
    currentUser, 
    userProfile, 
    isSuperAdmin, 
    activeRole,
    canPublishNews,
    canEditNews,
    canPublishTrustContent,
    canEditTrustContent,
    canPublishBulletin,
    canEditBulletin
  } = useAuth();

  const { config, updateConfig } = useConfig();

  // Determine allowed tabs based on permissions
  const hasNewsAccess = isSuperAdmin || canEditNews || canPublishNews;
  const hasTrustContentAccess = isSuperAdmin || canEditTrustContent || canPublishTrustContent;
  const hasBulletinAccess = isSuperAdmin || canEditBulletin || canPublishBulletin;
  const hasMediaAccess = hasNewsAccess || hasTrustContentAccess || hasBulletinAccess;

  // Initial active tab
  const getInitialTab = (): PublishingTab => {
    if (hasNewsAccess) return 'news';
    if (hasTrustContentAccess) return 'trust_content';
    if (hasBulletinAccess) return 'bulletins';
    return 'media';
  };

  const [activeTab, setActiveTab] = useState<PublishingTab>(getInitialTab);

  // Guard tab selection: ensure user never lands on unauthorized tab
  useEffect(() => {
    if (activeTab === 'news' && !hasNewsAccess) {
      setActiveTab(getInitialTab());
    } else if (activeTab === 'trust_content' && !hasTrustContentAccess) {
      setActiveTab(getInitialTab());
    } else if (activeTab === 'bulletins' && !hasBulletinAccess) {
      setActiveTab(getInitialTab());
    }
  }, [hasNewsAccess, hasTrustContentAccess, hasBulletinAccess, activeTab]);

  // -------------------------------------------------------------
  // NEWS & BULLETINS SHARED STATE & FIRESTORE SYNC
  // -------------------------------------------------------------
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'unpublished'>('all');

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [editingArticleDate, setEditingArticleDate] = useState<string | null>(null);
  const [editingArticleStatus, setEditingArticleStatus] = useState<'published' | 'draft' | 'unpublished'>('published');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('News & Announcements');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [readTime, setReadTime] = useState('3 min read');
  const [tag, setTag] = useState('Official Bulletin');
  const [isSavingArticle, setIsSavingArticle] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Media upload inside editor
  const [imageSourceMode, setImageSourceMode] = useState<'upload' | 'url'>('upload');
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Article preview modal
  const [previewArticle, setPreviewArticle] = useState<NewsArticle | null>(null);

  // Delete modal
  const [deleteConfirmArticle, setDeleteConfirmArticle] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingArticle, setIsDeletingArticle] = useState(false);

  // -------------------------------------------------------------
  // TRUST CONTENT FORM STATE
  // -------------------------------------------------------------
  const [trustAboutText, setTrustAboutText] = useState(config.aboutTrust?.overviewIntroduction || config.aboutTrust?.purpose || '');
  const [trustVision, setTrustVision] = useState(config.aboutTrust?.visionStatement || '');
  const [trustMission, setTrustMission] = useState(config.aboutTrust?.missionStatement || '');
  const [chairmanName, setChairmanName] = useState(config.chairmanMessage?.name || 'Janab Syed Ali Raza Zaidi');
  const [chairmanDesignation, setChairmanDesignation] = useState(config.chairmanMessage?.designation || 'Chairman & Managing Trustee');
  const [chairmanPhotoUrl, setChairmanPhotoUrl] = useState(config.chairmanMessage?.photoUrl || '');
  const [chairmanMessageText, setChairmanMessageText] = useState(config.chairmanMessage?.message || '');
  const [announcementText, setAnnouncementText] = useState(config.announcementBarText || '');
  const [announcementLink, setAnnouncementLink] = useState(config.announcementBarLink || '');
  const [announcementBadge, setAnnouncementBadge] = useState(config.announcementBarBadge || 'OFFICIAL');
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(config.isAnnouncementBarActive ?? true);
  const [isSavingTrustContent, setIsSavingTrustContent] = useState(false);
  const [trustContentNotice, setTrustContentNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Notification helper
  const showNotice = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (onNotify) onNotify(msg, type);
  };

  // Sync news and bulletins from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'news'), (snapshot) => {
      const list: NewsArticle[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (data.status === 'deleted' || data.isDeleted) return;
        list.push({
          id: d.id,
          title: data.title || 'Untitled Bulletin',
          category: data.category || 'General',
          date: data.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          summary: data.summary || '',
          content: data.content || '',
          author: data.author || 'FET Editorial Bureau',
          readTime: data.readTime || '3 min read',
          imageUrl: data.imageUrl || '',
          tag: data.tag || 'Official Bulletin',
          status: (data.status === 'draft' ? 'draft' : data.status === 'unpublished' ? 'unpublished' : 'published')
        });
      });
      setArticles(list);
      setIsLoadingArticles(false);
    }, (err) => {
      console.warn('Realtime news sync note:', err);
      setIsLoadingArticles(false);
    });
    return () => unsub();
  }, []);

  // Update trust form state when config changes
  useEffect(() => {
    if (config) {
      if (config.aboutTrust?.overviewIntroduction) setTrustAboutText(config.aboutTrust.overviewIntroduction);
      else if (config.aboutTrust?.purpose) setTrustAboutText(config.aboutTrust.purpose);
      if (config.aboutTrust?.visionStatement) setTrustVision(config.aboutTrust.visionStatement);
      if (config.aboutTrust?.missionStatement) setTrustMission(config.aboutTrust.missionStatement);
      if (config.chairmanMessage?.name) setChairmanName(config.chairmanMessage.name);
      if (config.chairmanMessage?.designation) setChairmanDesignation(config.chairmanMessage.designation);
      if (config.chairmanMessage?.photoUrl) setChairmanPhotoUrl(config.chairmanMessage.photoUrl);
      if (config.chairmanMessage?.message) setChairmanMessageText(config.chairmanMessage.message);
      if (config.announcementBarText) setAnnouncementText(config.announcementBarText);
      if (config.announcementBarLink) setAnnouncementLink(config.announcementBarLink);
      if (config.announcementBarBadge) setAnnouncementBadge(config.announcementBarBadge);
      if (config.isAnnouncementBarActive !== undefined) setIsAnnouncementActive(config.isAnnouncementBarActive);
    }
  }, [config]);

  // Determine user's assigned title for display
  const getPublishingTitle = () => {
    if (isSuperAdmin) return 'Super Administrator';
    const perms = [...(userProfile?.permissions || []), ...(userProfile?.customPermissions || [])];
    const titles: string[] = [];
    if (canPublishNews) titles.push('News Publisher');
    else if (canEditNews) titles.push('News Editor');

    if (canPublishTrustContent) titles.push('Trust Content Publisher');
    else if (canEditTrustContent) titles.push('Trust Content Editor');

    if (canPublishBulletin) titles.push('Bulletin Publisher');
    else if (canEditBulletin) titles.push('Bulletin Editor');

    if (titles.length === 0 && (activeRole === 'content_admin' || userProfile?.roles?.includes('content_admin'))) {
      return 'Content Administrator';
    }
    if (titles.length === 0 && (activeRole === 'blog_admin' || userProfile?.roles?.includes('blog_admin'))) {
      return 'Blog & Media Administrator';
    }
    return titles.length > 0 ? titles.join(' • ') : 'Authorized Publisher';
  };

  // -------------------------------------------------------------
  // ARTICLE CRUD HANDLERS
  // -------------------------------------------------------------
  const handleOpenEditor = (article?: NewsArticle) => {
    setFormError(null);
    if (article) {
      setEditingArticleId(article.id);
      setEditingArticleDate(article.date);
      setEditingArticleStatus(article.status === 'draft' ? 'draft' : article.status === 'unpublished' ? 'unpublished' : 'published');
      setTitle(article.title);
      setCategory(article.category || 'News & Announcements');
      setSummary(article.summary || '');
      setContent(article.content || '');
      setImageUrl(article.imageUrl || '');
      setUrlInputValue(article.imageUrl || '');
      setReadTime(article.readTime || '3 min read');
      setTag(article.tag || (activeTab === 'bulletins' ? 'Official Circular' : 'Official Bulletin'));
      setImageSourceMode(article.imageUrl ? 'url' : 'upload');
    } else {
      setEditingArticleId(null);
      setEditingArticleDate(null);
      setEditingArticleStatus('published');
      setTitle('');
      setCategory(activeTab === 'bulletins' ? 'Official Bulletin' : 'News & Announcements');
      setSummary('');
      setContent('');
      setImageUrl('');
      setUrlInputValue('');
      setReadTime('3 min read');
      setTag(activeTab === 'bulletins' ? 'Official Circular' : 'Official Bulletin');
      setImageSourceMode('upload');
    }
    setIsEditorOpen(true);
  };

  const handleSaveArticle = async (targetStatus: 'published' | 'draft' | 'unpublished') => {
    const isBulletinItem = category.toLowerCase().includes('bulletin') || tag.toLowerCase().includes('circular') || activeTab === 'bulletins';

    // Verify publishing rights
    if (targetStatus === 'published') {
      const allowedToPublish = isBulletinItem ? canPublishBulletin : canPublishNews;
      if (!allowedToPublish) {
        setFormError('Insufficient Permission: You have Editor rights to save drafts, but publishing live requires Publisher clearance.');
        return;
      }
    } else {
      const allowedToEdit = isBulletinItem ? (canEditBulletin || canPublishBulletin) : (canEditNews || canPublishNews);
      if (!allowedToEdit) {
        setFormError('Access Denied: You do not possess editing clearance for this content.');
        return;
      }
    }

    if (!title.trim()) {
      setFormError('Headline or title is required.');
      return;
    }

    const effectiveSummary = summary.trim() || (content.trim().slice(0, 160) + (content.trim().length > 160 ? '...' : ''));
    if (!effectiveSummary.trim() && targetStatus === 'published') {
      setFormError('Summary preview or content is required to publish.');
      return;
    }

    setIsSavingArticle(true);
    setFormError(null);

    try {
      const articleDocId = editingArticleId || `news-${Date.now()}`;
      const nowFormatted = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const authorName = userProfile?.fullLegalName || userProfile?.fullName || userProfile?.displayName || currentUser?.displayName || 'FET Editorial Bureau';
      const articleDate = (editingArticleId && editingArticleDate && !(editingArticleStatus === 'draft' && targetStatus === 'published'))
        ? editingArticleDate
        : nowFormatted;

      const finalImageUrl = (imageSourceMode === 'url' ? urlInputValue.trim() : imageUrl.trim()) || imageUrl.trim();

      const payload = cleanFirestoreData({
        id: articleDocId,
        title: title.trim(),
        category: category.trim(),
        summary: effectiveSummary,
        content: content.trim() || effectiveSummary,
        author: authorName,
        readTime: readTime.trim() || '3 min read',
        imageUrl: finalImageUrl,
        tag: tag.trim() || (targetStatus === 'draft' ? 'Draft' : 'Official Bulletin'),
        status: targetStatus,
        updatedAt: new Date().toISOString(),
        date: articleDate,
        isBulletin: isBulletinItem
      });

      // Write to Firestore /news and dual-sync /posts
      const newsRef = doc(db, 'news', articleDocId);
      await setDoc(newsRef, payload, { merge: true });

      try {
        const postsRef = doc(db, 'posts', articleDocId);
        await setDoc(postsRef, payload, { merge: true });
      } catch {}

      if (isBulletinItem) {
        try {
          const bulletinRef = doc(db, 'bulletins', articleDocId);
          await setDoc(bulletinRef, payload, { merge: true });
        } catch {}
      }

      await logAuditEvent({
        actorUid: currentUser?.uid || 'authorized-publisher',
        actorEmail: currentUser?.email || '',
        actorRole: activeRole || 'content_admin',
        action: editingArticleId 
          ? (targetStatus === 'draft' ? 'PUBLISHING_DRAFT_UPDATED' : 'PUBLISHING_ARTICLE_UPDATED')
          : (targetStatus === 'draft' ? 'PUBLISHING_DRAFT_CREATED' : 'PUBLISHING_ARTICLE_PUBLISHED'),
        targetEntity: 'news',
        targetId: articleDocId,
        details: { title: title.trim(), status: targetStatus, authorName }
      });

      showNotice(
        targetStatus === 'draft'
          ? `Draft "${title.trim()}" saved securely.`
          : targetStatus === 'unpublished'
          ? `"${title.trim()}" deactivated and taken offline.`
          : `"${title.trim()}" successfully published live to the official website!`,
        targetStatus === 'published' ? 'success' : 'info'
      );

      setIsEditorOpen(false);
    } catch (err: any) {
      console.error('Error saving article:', err);
      setFormError(err?.message || 'Failed to save dispatch. Please check permissions.');
    } finally {
      setIsSavingArticle(false);
    }
  };

  const handleTogglePublish = async (article: NewsArticle) => {
    const isCurrentlyPublished = article.status === 'published';
    const targetStatus = isCurrentlyPublished ? 'unpublished' : 'published';
    const isBulletinItem = article.category?.toLowerCase().includes('bulletin') || article.tag?.toLowerCase().includes('circular');
    
    if (targetStatus === 'published') {
      const allowed = isBulletinItem ? canPublishBulletin : canPublishNews;
      if (!allowed) {
        showNotice('Insufficient Permission: Publisher clearance required to make content live.', 'error');
        return;
      }
    }

    try {
      const newsRef = doc(db, 'news', article.id);
      const updateData = cleanFirestoreData({
        ...article,
        status: targetStatus,
        updatedAt: new Date().toISOString()
      });
      await setDoc(newsRef, updateData, { merge: true });

      try {
        const postsRef = doc(db, 'posts', article.id);
        await setDoc(postsRef, updateData, { merge: true });
      } catch {}

      showNotice(
        targetStatus === 'published'
          ? `"${article.title}" is now published and live on the website.`
          : `"${article.title}" deactivated.`,
        targetStatus === 'published' ? 'success' : 'info'
      );
    } catch (err: any) {
      console.error('Status toggle error:', err);
      showNotice(`Failed to update status: ${err?.message || 'Permission denied'}`, 'error');
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmArticle) return;
    const isBulletinItem = activeTab === 'bulletins';
    const allowed = isBulletinItem ? canPublishBulletin : canPublishNews;
    if (!allowed && !isSuperAdmin) {
      showNotice('Permission Denied: Only authorized publishers can delete dispatches.', 'error');
      return;
    }

    setIsDeletingArticle(true);
    try {
      const newsRef = doc(db, 'news', deleteConfirmArticle.id);
      await deleteDoc(newsRef).catch(async () => {
        await setDoc(newsRef, {
          id: deleteConfirmArticle.id,
          status: 'deleted',
          isDeleted: true,
          deletedAt: new Date().toISOString()
        }, { merge: true });
      });

      try {
        const postsRef = doc(db, 'posts', deleteConfirmArticle.id);
        await deleteDoc(postsRef);
      } catch {}

      showNotice(`"${deleteConfirmArticle.title}" permanently removed.`);
      setDeleteConfirmArticle(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      showNotice(`Failed to delete: ${err?.message || 'Permission denied'}`, 'error');
    } finally {
      setIsDeletingArticle(false);
    }
  };

  // Image Upload Handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    setIsImageUploading(true);
    setFormError(null);
    try {
      const res = await uploadCmsMedia(file, 'articles');
      setImageUrl(res.url);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to upload image to Firebase Storage.');
    } finally {
      setIsImageUploading(false);
    }
  };

  // -------------------------------------------------------------
  // TRUST CONTENT SAVE HANDLER
  // -------------------------------------------------------------
  const handleSaveTrustContent = async () => {
    if (!canPublishTrustContent && !canEditTrustContent && !isSuperAdmin) {
      setTrustContentNotice({
        type: 'error',
        message: 'Permission Denied: You do not possess clearance to manage Trust content.'
      });
      return;
    }

    setIsSavingTrustContent(true);
    setTrustContentNotice(null);

    try {
      const adminUser = {
        uid: currentUser?.uid || 'authorized-publisher',
        email: currentUser?.email || 'publisher@fetindia.org',
        role: (activeRole || (isSuperAdmin ? 'super_admin' : 'content_admin')) as UserRole
      };

      const existingAbout = config.aboutTrust || {};
      const updatedAboutTrust = {
        ...existingAbout,
        overviewIntroduction: trustAboutText.trim(),
        purpose: trustAboutText.trim(),
        visionStatement: trustVision.trim(),
        missionStatement: trustMission.trim(),
        updatedAt: new Date().toISOString()
      };

      const updatedChairman = {
        name: chairmanName.trim(),
        designation: chairmanDesignation.trim(),
        photoUrl: chairmanPhotoUrl.trim(),
        message: chairmanMessageText.trim(),
        vision: trustVision.trim(),
        leadershipStatement: chairmanMessageText.trim().slice(0, 200)
      };

      await updateConfig({
        aboutTrust: updatedAboutTrust,
        chairmanMessage: updatedChairman,
        announcementBarText: announcementText.trim(),
        announcementBarLink: announcementLink.trim(),
        announcementBarBadge: announcementBadge.trim(),
        isAnnouncementBarActive: isAnnouncementActive
      }, adminUser);

      setTrustContentNotice({
        type: 'success',
        message: 'Trust Content, Leadership Updates & Announcements published live to Firestore!'
      });
      showNotice('Trust Content successfully updated and published!', 'success');
    } catch (err: any) {
      console.error('Error saving trust content:', err);
      setTrustContentNotice({
        type: 'error',
        message: `Failed to save Trust content: ${err?.message || 'Firestore permission error'}`
      });
    } finally {
      setIsSavingTrustContent(false);
    }
  };

  // Filtering articles
  const filteredArticles = articles.filter(a => {
    // If tab is bulletins, only show bulletins/circulars; if tab is news, show all or news
    if (activeTab === 'bulletins') {
      const isBul = a.category?.toLowerCase().includes('bulletin') || 
                    a.tag?.toLowerCase().includes('circular') || 
                    a.tag?.toLowerCase().includes('bulletin') ||
                    Boolean((a as any).isBulletin);
      if (!isBul) return false;
    }

    if (categoryFilter !== 'all' && a.category?.toLowerCase() !== categoryFilter.toLowerCase()) {
      return false;
    }

    if (statusFilter !== 'all') {
      const currentStat = a.status || 'published';
      if (currentStat !== statusFilter) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchSummary = a.summary?.toLowerCase().includes(q);
      const matchContent = a.content?.toLowerCase().includes(q);
      const matchAuthor = a.author?.toLowerCase().includes(q);
      return matchTitle || matchSummary || matchContent || matchAuthor;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 pb-20" id="fet-delegated-publishing-dashboard">
      
      {/* ============================================================== */}
      {/* 1. TOP HEADER BANNER (Shows Delegated Identity & Rights) */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100 shadow-2xs">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  Publishing & Media Control Center
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-200">
                  Dedicated Workspace
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Official institutional publishing suite strictly authorized for Fatimyah Educational Trust dispatches.
              </p>
            </div>
          </div>
        </div>

        {/* Assigned Clearances Badge & Action */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-2 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            <span>Role: {getPublishingTitle()}</span>
          </div>

          {(activeTab === 'news' || activeTab === 'bulletins') && (
            <button
              onClick={() => handleOpenEditor()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              id="btn-create-publishing-dispatch"
            >
              <Plus className="w-4 h-4" />
              <span>{activeTab === 'bulletins' ? 'New Official Bulletin' : 'New News Dispatch'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. DEDICATED NAVIGATION TABS (Strictly isolated by permissions) */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-2xs flex flex-wrap gap-1.5">
        {hasNewsAccess && (
          <button
            onClick={() => setActiveTab('news')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'news'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            id="tab-publishing-news"
          >
            <Newspaper className="w-4 h-4" />
            <span>News & Articles</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {articles.length}
            </span>
          </button>
        )}

        {hasTrustContentAccess && (
          <button
            onClick={() => setActiveTab('trust_content')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'trust_content'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            id="tab-publishing-trust-content"
          >
            <Building2 className="w-4 h-4" />
            <span>Trust Content & Leadership</span>
          </button>
        )}

        {hasBulletinAccess && (
          <button
            onClick={() => setActiveTab('bulletins')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'bulletins'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            id="tab-publishing-bulletins"
          >
            <FileText className="w-4 h-4" />
            <span>Official Bulletins & Circulars</span>
          </button>
        )}

        {hasMediaAccess && (
          <button
            onClick={() => setActiveTab('media')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'media'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            id="tab-publishing-media"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Media & Image Guidelines</span>
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: NEWS & ARTICLES */}
      {/* ============================================================== */}
      {activeTab === 'news' && hasNewsAccess && (
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Dispatches</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{articles.length}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Live on Portal</span>
              <span className="text-xl font-black text-emerald-900 mt-1 block">
                {articles.filter(a => a.status === 'published' || !a.status).length}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Editorial Drafts</span>
              <span className="text-xl font-black text-amber-900 mt-1 block">
                {articles.filter(a => a.status === 'draft').length}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Your Clearance</span>
              <span className="text-xs font-black text-rose-700 mt-2 block">
                {canPublishNews ? 'Full Publisher' : 'Editorial Draftsman'}
              </span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search headlines, contents, or authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="published">Live Only</option>
                <option value="draft">Drafts Only</option>
                <option value="unpublished">Unpublished</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-hidden"
              >
                <option value="all">All Categories</option>
                <option value="News & Announcements">News & Announcements</option>
                <option value="Educational Programs">Educational Programs</option>
                <option value="Community Relief">Community Relief</option>
                <option value="Academic Excellence">Academic Excellence</option>
              </select>
            </div>
          </div>

          {/* Articles Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">Headline & Tag</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Author</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingArticles ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-600" />
                        <span>Loading official dispatches...</span>
                      </td>
                    </tr>
                  ) : filteredArticles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No articles match the active search or filters.
                      </td>
                    </tr>
                  ) : (
                    filteredArticles.map((article) => {
                      const isLive = article.status === 'published' || !article.status;
                      const isDraft = article.status === 'draft';

                      return (
                        <tr key={article.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-bold text-slate-900 line-clamp-1">{article.title}</div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span className="font-semibold text-rose-700">{article.tag || 'Official Bulletin'}</span>
                              <span>•</span>
                              <span>{article.readTime || '3 min'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">
                            {article.category}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {article.author}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {article.date}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isLive ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200">
                                Live
                              </span>
                            ) : isDraft ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                                Draft
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setPreviewArticle(article)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-colors"
                                title="Preview Dispatch"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {(canEditNews || canPublishNews) && (
                                <button
                                  onClick={() => handleOpenEditor(article)}
                                  className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 cursor-pointer transition-colors"
                                  title="Edit Dispatch"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {canPublishNews && (
                                <button
                                  onClick={() => handleTogglePublish(article)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    isLive
                                      ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                                      : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                                  }`}
                                  title={isLive ? 'Take Offline' : 'Publish Live'}
                                >
                                  {isLive ? <EyeOff className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                                </button>
                              )}

                              {canPublishNews && (
                                <button
                                  onClick={() => setDeleteConfirmArticle({ id: article.id, title: article.title })}
                                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer transition-colors"
                                  title="Delete Dispatch"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: TRUST CONTENT & LEADERSHIP CMS */}
      {/* ============================================================== */}
      {activeTab === 'trust_content' && hasTrustContentAccess && (
        <div className="space-y-6">
          {trustContentNotice && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 border text-xs ${
              trustContentNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}>
              {trustContentNotice.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="font-semibold">{trustContentNotice.message}</span>
            </div>
          )}

          {/* Section 1: Official Institutional Identifiers (Locked Legal Core) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  1. Statutory Legal Identifiers
                </h3>
                <p className="text-xs text-slate-500">Official legal identity established on August 15, 1994.</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                Verified Legal Entity
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Organization Legal Name</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{config.legalName || 'Fatimyah Educational Trust'}</span>
                <span className="text-[9px] text-slate-400 block mt-1">Locked for integrity</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Registration Authority</span>
                <span className="font-bold text-slate-900 mt-0.5 block">Sub-Divisional Magistrate (SDM)</span>
                <span className="text-[9px] text-slate-400 block mt-1">Reg No: E 9822 (1994)</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">NITI Aayog DARPAN ID</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{config.darpanId || 'JK/2026/1153821'}</span>
                <span className="text-[9px] text-slate-400 block mt-1">Government NGO Portal</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">PAN & Income Tax Status</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{config.panNumber || 'AABTF0015H'}</span>
                <span className="text-[9px] text-slate-400 block mt-1">Sections 12A & 80G Certified</span>
              </div>
            </div>
          </div>

          {/* Section 2: Trust Vision, Mission & About Text */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
              2. Trust Narrative, Vision & Mission Statements
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  About the Trust Narrative & Institutional History
                </label>
                <textarea
                  rows={4}
                  value={trustAboutText}
                  onChange={(e) => setTrustAboutText(e.target.value)}
                  placeholder="Describe the 1994 founding story, historical background, and commitment to rural and underserved education..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Vision Statement
                  </label>
                  <textarea
                    rows={3}
                    value={trustVision}
                    onChange={(e) => setTrustVision(e.target.value)}
                    placeholder="Our vision for high-quality education and societal transformation..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Mission Statement
                  </label>
                  <textarea
                    rows={3}
                    value={trustMission}
                    onChange={(e) => setTrustMission(e.target.value)}
                    placeholder="Our active mission: scholarships, talent searches, community relief, and schools..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Chairman's Message & Leadership Message */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
              3. Chairman's Message & Managing Trustee Profile
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">Chairman Full Name</label>
                <input
                  type="text"
                  value={chairmanName}
                  onChange={(e) => setChairmanName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-800">Designation / Title</label>
                <input
                  type="text"
                  value={chairmanDesignation}
                  onChange={(e) => setChairmanDesignation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-800">Portrait Image URL</label>
                <input
                  type="text"
                  value={chairmanPhotoUrl}
                  onChange={(e) => setChairmanPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="block font-bold text-slate-800">Official Leadership Message</label>
                <textarea
                  rows={4}
                  value={chairmanMessageText}
                  onChange={(e) => setChairmanMessageText(e.target.value)}
                  placeholder="Official address by the Chairman on educational advancement and integrity..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Public Announcement Banner */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                4. Live Top Announcement Bar
              </h3>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={isAnnouncementActive}
                  onChange={(e) => setIsAnnouncementActive(e.target.checked)}
                  className="rounded text-rose-600"
                />
                <span>Active on Public Website</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">Badge Label</label>
                <input
                  type="text"
                  value={announcementBadge}
                  onChange={(e) => setAnnouncementBadge(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block font-bold text-slate-800">Announcement Headline / Text</label>
                <input
                  type="text"
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="e.g. Official Scholarship Examination 2026 Registration Open nationwide"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Save Action Bar */}
          <div className="p-4 bg-slate-900 rounded-3xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div>
              <span className="text-xs font-bold block">Publish Trust Content Modifications</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {canPublishTrustContent ? 'Direct public portal synchronization authorized.' : 'Draft updates will be logged for review.'}
              </span>
            </div>

            <button
              onClick={handleSaveTrustContent}
              disabled={isSavingTrustContent}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 transition-all cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
              id="btn-publish-trust-content"
            >
              {isSavingTrustContent ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSavingTrustContent ? 'Publishing...' : 'Save & Publish Trust Content'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: OFFICIAL BULLETINS & CIRCULARS */}
      {/* ============================================================== */}
      {activeTab === 'bulletins' && hasBulletinAccess && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block">Official Gazette & Press Circular Protocol:</span>
              <span className="text-amber-800 block mt-0.5">
                Bulletins and circulars represent formal decisions, exam schedules, public notices, and scholarship circulars of Fatimyah Educational Trust.
              </span>
            </div>
          </div>

          {/* Bulletins Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">Circular Headline</th>
                    <th className="py-3.5 px-4">Notice Type</th>
                    <th className="py-3.5 px-4">Author</th>
                    <th className="py-3.5 px-4">Issuance Date</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredArticles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No official bulletins found. Click "New Official Bulletin" to issue one.
                      </td>
                    </tr>
                  ) : (
                    filteredArticles.map((article) => {
                      const isLive = article.status === 'published' || !article.status;
                      const isDraft = article.status === 'draft';

                      return (
                        <tr key={article.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 max-w-sm">
                            <div className="font-bold text-slate-900 line-clamp-1">{article.title}</div>
                            <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{article.summary}</div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-rose-700">
                            {article.tag || 'Official Circular'}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {article.author}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {article.date}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isLive ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-200">
                                Live
                              </span>
                            ) : isDraft ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-200">
                                Draft
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-600">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setPreviewArticle(article)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                                title="Preview"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEditor(article)}
                                className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {canPublishBulletin && (
                                <button
                                  onClick={() => handleTogglePublish(article)}
                                  className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 cursor-pointer"
                                  title="Toggle Status"
                                >
                                  {isLive ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Send className="w-3.5 h-3.5 text-emerald-600" />}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: MEDIA & IMAGE GUIDELINES */}
      {/* ============================================================== */}
      {activeTab === 'media' && hasMediaAccess && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-black text-slate-900">
              Media & Artwork Standards for FET India Publications
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Guaranteed guidelines for crisp presentation across desktop, mobile and PWA displays.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-extrabold text-slate-900 block text-sm">Recommended Aspect Ratio</span>
              <p className="text-slate-600 leading-relaxed">
                Use <strong>16:9 widescreen</strong> (1200x675 px) for top news cover banners, and <strong>1:1 square</strong> for portraits and leadership messages.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-extrabold text-slate-900 block text-sm">File Formats & Limits</span>
              <p className="text-slate-600 leading-relaxed">
                Preferred formats are <strong>WebP</strong>, <strong>JPG</strong>, and <strong>PNG</strong>. Please keep uploaded files under <strong>2 MB</strong> for rapid mobile loading.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-extrabold text-slate-900 block text-sm">Institutional Brand Colors</span>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-6 h-6 rounded-lg bg-[#0D6E42]" title="Trust Green (#0D6E42)" />
                <div className="w-6 h-6 rounded-lg bg-[#0B2545]" title="Trust Blue (#0B2545)" />
                <div className="w-6 h-6 rounded-lg bg-[#D97706]" title="Accent Amber (#D97706)" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ARTICLE / BULLETIN EDITOR MODAL */}
      {/* ============================================================== */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-5 sm:p-6 space-y-4 my-8 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-rose-600" />
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {editingArticleId ? 'Edit Official Publication' : 'Create New Official Publication'}
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
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Headline / Title <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter dispatch headline..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-700"
                  >
                    <option value="News & Announcements">News & Announcements</option>
                    <option value="Official Bulletin">Official Bulletin</option>
                    <option value="Educational Programs">Educational Programs</option>
                    <option value="Community Relief">Community Relief</option>
                    <option value="Academic Excellence">Academic Excellence</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="e.g. Official Bulletin, Circular No. 12"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reading Duration</label>
                  <input
                    type="text"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    placeholder="3 min read"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Cover Image */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cover Image Source</label>
                <div className="flex items-center gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => setImageSourceMode('upload')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      imageSourceMode === 'upload' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageSourceMode('url')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      imageSourceMode === 'url' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Image URL
                  </button>
                </div>

                {imageSourceMode === 'upload' ? (
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isImageUploading ? 'Processing...' : 'Choose Image File'}</span>
                    </button>
                    {imageUrl && (
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Image Attached
                      </span>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={urlInputValue}
                    onChange={(e) => {
                      setUrlInputValue(e.target.value);
                      setImageUrl(e.target.value);
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                )}
              </div>

              {/* Summary */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Summary / Excerpt <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Concise 1-2 sentence overview shown in dispatches list..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Content Body */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Body / Dispatch Text</label>
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Complete text of the circular, announcement, or article..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs"
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

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveArticle('draft')}
                  disabled={isSavingArticle}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save as Draft</span>
                </button>

                {(canPublishNews || canPublishBulletin || isSuperAdmin) && (
                  <button
                    type="button"
                    onClick={() => handleSaveArticle('published')}
                    disabled={isSavingArticle}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSavingArticle ? 'Publishing...' : 'Publish to Website'}</span>
                  </button>
                )}
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
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-rose-100 text-rose-800">
                {previewArticle.category} • {previewArticle.tag}
              </span>
              <button onClick={() => setPreviewArticle(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {previewArticle.imageUrl && (
              <img src={previewArticle.imageUrl} alt={previewArticle.title} className="w-full h-48 object-cover rounded-2xl border" />
            )}

            <h3 className="text-lg font-black text-slate-900 leading-snug">{previewArticle.title}</h3>

            <div className="flex items-center gap-3 text-xs text-slate-500 border-y border-slate-100 py-2">
              <span>Author: <strong>{previewArticle.author}</strong></span>
              <span>•</span>
              <span>Date: {previewArticle.date}</span>
            </div>

            <p className="text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border">
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

      {/* ============================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ============================================================== */}
      {deleteConfirmArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Permanently Delete Dispatch?</h3>
                <p className="text-xs text-slate-500">This action will remove the article from the website permanently.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-slate-800 line-clamp-2">
                "{deleteConfirmArticle.title}"
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmArticle(null)}
                disabled={isDeletingArticle}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isDeletingArticle}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {isDeletingArticle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeletingArticle ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
