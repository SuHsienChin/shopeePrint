  <nav class='navbar navbar-default'>
    <a class='navbar-brand'  style="font-size: 9pt;" href='/'>HR管理系統</a>
    <a class='toggle-nav btn pull-left' href='#'><i class='icon-reorder'></i></a>
    <div class="news-group">
      <ul class="list-unstyled">
        <li>
          <span class="label label-news" style="font-size: 9pt;">人事薪資系統</span>
        </li>
      </ul>
    </div>
    <ul class='nav'>
      <li class='dropdown dark user-menu'>
        <a class='dropdown-toggle' data-toggle='dropdown' href='#'>
          <!-- <img width="23" height="23" alt="" src="/assets/images/avatar.jpg" /> -->
          <span class='user-name' style="font-size: 9pt;">Hello, {{$userInfo->employee->name}}</span>
        <b class='caret'></b>
        </a>
        <ul class='dropdown-menu'>
          <li>
            <a href='/'>
              <i class='icon-home'></i>
              前往首頁
            </a>
          </li>
        @if($userInfo->can('view.user'))
          <li>
            <a href='/person/permission'>
              <i class='icon-gears'></i>
              前往權限管理區
            </a>
          </li>

          <li>
            <a href='/person/user'>
              <i class='icon-cog'></i>
              帳號管理
            </a>
          </li>
        @endif  
          <li>
            <a href='/reset/pwd'>
              <i class='icon-user'></i>
              修改密碼
            </a>
          </li>
          <li class='divider'></li>
          <li>
            <a href='/logout'>
              <i class='icon-signout'></i>
              登出
            </a>
          </li>
        </ul>
      </li>
    </ul>
  </nav>