import Component from 'flarum/common/Component';
import Link from 'flarum/common/components/Link';

import icon from 'flarum/common/helpers/icon';
import ItemList from 'flarum/common/utils/ItemList';
import sortTags from 'flarum/tags/utils/sortTags';

import StatWidget from './StatWidget';
import LastDiscussionWidget from './LastDiscussionWidget';
import app from 'flarum/forum/app';
import classList from 'flarum/common/utils/classList';

import type Mithril from 'mithril';

interface Attrs {
  model: any;
  parent: any;
}

export default class Category extends Component<Attrs> {
  tag!: any;
  isChild!: boolean;
  collapsed!: boolean;
  compactMobileMode!: boolean;

  oninit(vnode) {
    super.oninit(vnode);

    this.tag = this.attrs.model;

    this.isChild = this.attrs.parent != null && this.attrs.parent != undefined;

    this.collapsed = this.getTag(this.tag.slug());

    window.addEventListener('resize', function () {
      m.redraw();
    });
  }

  view() {
    const tag = this.tag;

    if (!tag) {
      return null;
    }

    this.compactMobileMode = !!app.forum.attribute('categories.compactMobile');

    return (
      <li
        className={classList('TagCategory', `TagCategory-${tag.slug()}`, {
          SubCategory: this.isChild,
          ParentCategory: !this.isChild,
          compactMobile: this.compactMobileMode,
        })}
      >
        {this.categoryItems().toArray()}
      </li>
    );
  }

  categoryItems() {
    const items = new ItemList();
    const tag = this.tag;

    const children = this.isChild ? [] : sortTags(tag.children() || []);

    items.add(
      'link',
      <Link
        className={`TagCategory-content TagCategory-content-${tag.slug()}`}
        style={this.isChild ? {} : { backgroundColor: tag.color() }}
        href={app.route.tag(tag)}
      >
        {this.contentItems().toArray()}
      </Link>,
      100
    );

    if (!this.compactMobileMode && !this.isChild) {
      items.add(
        'children',
        <ol className="TagCategory-subTagList">{children.map((child) => [Category.component({ model: child, parent: this })])}</ol>,
        10
      );
    }

    return items;
  }

  contentItems() {
    const items = new ItemList();

    const tag = this.tag;
    const children = this.isChild ? [] : sortTags(tag.children() || []);

    items.add('top', <div className="TagCategory-top">{this.topItems().toArray()}</div>, 100);
    const childrenInContent = !this.isChild && this.compactMobileMode;

    if (!!children.length) {
      items.add(
        'toggleArrow',
        <button
          className="TagCategory-toggleArrow Button--ua-reset"
          onclick={(e: MouseEvent) => {
            this.toggleArrow(e);
          }}
        >
          {icon(this.collapsed ? 'fas fa-caret-down' : 'fas fa-caret-up')}
        </button>,
        10
      );
    }

    if (childrenInContent && !this.collapsed) {
      items.add(
        'children',
        <ol className="TagCategory-subTagList">{children.map((child) => [Category.component({ model: child, parent: this })])}</ol>,
        10
      );
    }

    return items;
  }

  topItems() {
    const items = new ItemList();
    const tag = this.tag;
    const children = this.isChild ? [] : sortTags(tag.children() || []);

    items.add(
      'identity',
      <div class="TagCategory-identity">
        <span className="TagCategory-icon">{this.iconItems().toArray()}</span>
        <div className="TagCategory-name">{this.nameItems().toArray()}</div>
      </div>,
      100
    );
    items.add('stats', <div className="TagCategory-stats StatWidgetList">{this.statItems().toArray()}</div>, 50);
    items.add(
      'lastDiscussion',
      <div className={classList('TagCategory-lastDiscussion', { empty: !tag.lastPostedDiscussion() })}>{this.lastDiscussionItems().toArray()}</div>,
      50
    );
    return items;
  }

  iconItems() {
    const items = new ItemList();

    if (this.tag.icon() && this.isChild) {
      const style: Record<string, unknown> = {};

      let iconClasses = 'fa-stack-1x CategoryIcon';

      if (app.forum.attribute('categories.childBareIcon')) {
        style.color = this.tag.color();
        iconClasses += ' NoBackgroundCategoryIcon';
      }

      const classes = this.compactMobileMode ? 'fa-stack fa-1x' : 'fa-stack fa-2x';

      items.add(
        'icon',
        <span className={classes}>
          {!!app.forum.attribute('categories.childBareIcon') && (
            <i className="fa fa-circle fa-stack-2x icon-background" style={{ color: this.tag.color() }}></i>
          )}
          {icon(this.tag.icon(), { className: iconClasses, style: style })}
        </span>,
        10
      );
    } else if (this.tag.icon() && !app.forum.attribute('categories.parentRemoveIcon')) {
      const classes = this.compactMobileMode ? 'fa-stack fa-2x' : 'fa-stack fa-3x';

      items.add('icon', <span className={classes}>{icon(this.tag.icon(), { className: 'fa-stack-1x CategoryIcon' })}</span>, 10);
    }

    return items;
  }

  nameItems() {
    const items = new ItemList();
    items.add('name', <h4 className="TagCategory-name">{this.tag.name()}</h4>, 15);
    return items;
  }

  statItems() {
    const items = new ItemList();

    if (this.isChild || !app.forum.attribute('categories.parentRemoveStats')) {
      items.add(
        'discussionCount',
        StatWidget.component({
          count: Intl.NumberFormat().format(this.tag.discussionCount()),
          label: app.translator.trans('askvortsov-categories.forum.stat-widgets.discussion_label'),
          icon: 'fas fa-file-alt',
        }),
        15
      );

      items.add(
        'postCount',
        StatWidget.component({
          count: Intl.NumberFormat().format(this.tag.postCount()),
          label: app.translator.trans('askvortsov-categories.forum.stat-widgets.post_label'),
          icon: 'fas fa-comment',
        }),
        10
      );
    }

    return items;
  }

  lastDiscussionItems() {
    const items = new ItemList();

    if (this.isChild || !app.forum.attribute('categories.parentRemoveLastDiscussion')) {
      items.add(
        'lastDiscussion',
        LastDiscussionWidget.component({
          discussion: this.tag.lastPostedDiscussion(),
        }),
        10
      );
    }

    return items;
  }

  oncreate(vnode) {
    super.oncreate(vnode);

    this.$('.TagCategory-content,.TagCategory-toggleArrow').on('mouseenter', function (e) {
      $(this).addClass('hover');
      if ($(this).parent().hasClass('SubCategory') || $(this).hasClass('TagCategory-toggleArrow')) {
        $(this).closest('.ParentCategory').children('.TagCategory-content').removeClass('hover');
      }
    });

    this.$('.TagCategory-content,.TagCategory-toggleArrow').on('mouseleave', function (e) {
      $(this).removeClass('hover');
      if ($(this).parent().hasClass('SubCategory') || $(this).hasClass('TagCategory-toggleArrow')) {
        $(this).closest('.ParentCategory').children('.TagCategory-content').addClass('hover');
      }
    });
  }

  onremove(vnode: Mithril.VnodeDOM<Attrs, this>): void {
    super.onremove(vnode);

    this.$('.TagCategory-content,.TagCategory-toggleArrow').off('mouseenter');
    this.$('.TagCategory-content,.TagCategory-toggleArrow').off('mouseleave');
  }

  toggleArrow(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.collapsed = !this.collapsed;
    this.saveTag(this.tag.slug(), this.collapsed);
    m.redraw();
  }

  getTag(slug: string) {
    let json = localStorage.getItem('tags-collapsed') ?? "{}";
    json = JSON.parse(json);
    return json[slug] ?? false;
  }

  saveTag(slug: string, status: boolean) {
    let json = localStorage.getItem('tags-collapsed') ?? "{}";
    json = JSON.parse(json);
    json[slug] = status;
    localStorage.setItem('tags-collapsed', JSON.stringify(json));
  }
}
