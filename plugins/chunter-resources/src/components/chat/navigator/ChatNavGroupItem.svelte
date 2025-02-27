<!--
// Copyright © 2024 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
-->
<script lang="ts">
  import type { Doc } from '@hcengineering/core'
  import notification, { DocNotifyContext, InboxNotification } from '@hcengineering/notification'
  import { getResource } from '@hcengineering/platform'
  import { createQuery, getClient } from '@hcengineering/presentation'
  import contact from '@hcengineering/contact'
  import { Action, IconEdit, IconSize } from '@hcengineering/ui'
  import { getActions, getDocTitle } from '@hcengineering/view-resources'
  import { getNotificationsCount, InboxNotificationsClientImpl } from '@hcengineering/notification-resources'
  import { createEventDispatcher } from 'svelte'

  import chunter from '../../../plugin'
  import { getChannelIcon, getChannelName } from '../../../utils'
  import Item from './NavItem.svelte'

  export let context: DocNotifyContext
  export let isSelected = false

  const client = getClient()
  const hierarchy = client.getHierarchy()
  const docQuery = createQuery()
  const dispatch = createEventDispatcher()
  const notificationClient = InboxNotificationsClientImpl.getClient()

  let notifications: InboxNotification[] = []

  let channelName: string | undefined = undefined
  let description: string | undefined = undefined
  let doc: Doc | undefined = undefined
  let iconSize: IconSize = 'x-small'
  let notificationsCount = 0
  let actions: Action[] = []

  $: docQuery.query(context.attachedToClass, { _id: context.attachedTo }, (res) => {
    doc = res[0]
  })

  $: doc &&
    getChannelName(context.attachedTo, context.attachedToClass, doc).then((res) => {
      channelName = res
    })

  $: doc &&
    !hierarchy.isDerived(context.attachedToClass, chunter.class.ChunterSpace) &&
    getDocTitle(client, context.attachedTo, context.attachedToClass, doc).then((res) => {
      description = res
    })

  notificationClient.inboxNotificationsByContext.subscribe((res) => {
    notifications = res.get(context._id) ?? []
  })

  $: isDirect = hierarchy.isDerived(context.attachedToClass, chunter.class.DirectMessage)
  $: isPerson = hierarchy.isDerived(context.attachedToClass, contact.class.Person)
  $: isDocChat = !hierarchy.isDerived(context.attachedToClass, chunter.class.ChunterSpace)

  $: if (isPerson) {
    iconSize = 'medium'
  } else if (isDocChat) {
    iconSize = 'x-large'
  } else {
    iconSize = 'x-small'
  }

  $: getNotificationsCount(context, notifications).then((res) => {
    notificationsCount = res
  })

  $: getChannelActions(context).then((res) => {
    actions = res
  })

  async function getChannelActions (context: DocNotifyContext): Promise<Action[]> {
    const result = []
    const excludedActions = [notification.action.DeleteContextNotifications, notification.action.UnReadNotifyContext]
    const actions = (await getActions(client, context, notification.class.DocNotifyContext)).filter(
      ({ _id }) => !excludedActions.includes(_id)
    )

    for (const action of actions) {
      const { visibilityTester } = action
      const isVisibleFn = visibilityTester && (await getResource(visibilityTester))
      const isVisible = isVisibleFn ? await isVisibleFn(context) : true

      if (!isVisible) {
        continue
      }

      result.push({
        icon: action.icon ?? IconEdit,
        label: action.label,
        action: async (_: any, evt: Event) => {
          const impl = await getResource(action.action)
          await impl(context, evt, action.actionProps)
        }
      })
    }
    return result
  }
</script>

<Item
  id={context._id}
  icon={getChannelIcon(context.attachedToClass)}
  withIconBackground={!isDirect && !isPerson}
  {iconSize}
  isBold={isDocChat}
  {isSelected}
  iconProps={{ value: doc }}
  {notificationsCount}
  title={channelName}
  intlTitle={isDocChat ? hierarchy.getClass(context.attachedToClass).label : chunter.string.Channel}
  {description}
  {actions}
  on:click={() => {
    dispatch('select', { doc, context })
  }}
/>
